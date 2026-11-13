import { Category, WorkoutLogEntry, User, ClientProgressResponse } from '@/types/workout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trainsmart_token');
}

/**
 * Set stored auth token
 */
export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('trainsmart_token', token);
  } else {
    localStorage.removeItem('trainsmart_token');
  }
}

/**
 * Helper to build auth headers
 */
function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/* ========================================================================= */
/* AUTHENTICATION APIS                                                       */
/* ========================================================================= */

export async function apiLogin(payload: { email: string; password: string }): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
}> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Login gagal.',
        errors: data.errors,
      };
    }
    setAuthToken(data.token);
    return {
      success: true,
      message: data.message,
      token: data.token,
      user: data.user,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Koneksi ke backend gagal.' };
  }
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'client' | 'trainer';
  specialization?: string;
  phone?: string;
  trainer_id?: number | null;
}): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
}> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Registrasi gagal. Periksa data kembali.',
        errors: data.errors,
      };
    }
    setAuthToken(data.token);
    return {
      success: true,
      message: data.message,
      token: data.token,
      user: data.user,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Koneksi ke backend gagal.' };
  }
}

export async function apiGetMe(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    // Ignore error
  } finally {
    setAuthToken(null);
  }
}

/* ========================================================================= */
/* ROLE SPECIFIC APIS: CLIENT & TRAINERS                                     */
/* ========================================================================= */

export async function getTrainers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/trainers`, { cache: 'no-store' });
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function selectPersonalTrainer(trainerId: number | null): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const res = await fetch(`${API_BASE}/client/select-trainer`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ trainer_id: trainerId }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || 'Pilihan trainer diperbarui.',
      user: data.data,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengubah trainer.' };
  }
}

export async function getClientMyProgress(): Promise<{
  summary: { total_sets: number; total_volume_kg: number; average_rir: number | null };
  trainer: User | null;
  logs: WorkoutLogEntry[];
} | null> {
  try {
    const res = await fetch(`${API_BASE}/client/my-progress`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      summary: json.summary,
      trainer: json.trainer,
      logs: json.data || [],
    };
  } catch {
    return null;
  }
}

/* ========================================================================= */
/* ROLE SPECIFIC APIS: PERSONAL TRAINER                                      */
/* ========================================================================= */

export async function getTrainerClients(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/trainer/clients`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function addTrainerClient(email: string): Promise<{ success: boolean; message: string; data?: User }> {
  try {
    const res = await fetch(`${API_BASE}/trainer/clients`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || 'Klien berhasil ditambahkan.',
      data: data.data,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menambahkan klien.' };
  }
}

export async function removeTrainerClient(clientId: number): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/trainer/clients/${clientId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || 'Klien dilepas.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal melepas klien.' };
  }
}

export async function getClientProgress(clientId: number): Promise<ClientProgressResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/trainer/clients/${clientId}/progress`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ========================================================================= */
/* ROLE SPECIFIC APIS: ADMIN                                                 */
/* ========================================================================= */

export async function getAdminStats(): Promise<{
  total_users: number;
  total_trainers: number;
  total_clients: number;
  total_logs: number;
  total_exercises: number;
  total_tonnage_kg: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function getAdminUsers(role?: string): Promise<User[]> {
  try {
    const url = role ? `${API_BASE}/admin/users?role=${role}` : `${API_BASE}/admin/users`;
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function updateAdminUser(id: number, payload: Partial<User>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || 'User berhasil diperbarui.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal update user.' };
  }
}

export async function deleteAdminUser(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || 'User berhasil dihapus.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghapus user.' };
  }
}

/* ========================================================================= */
/* WORKOUT DATA APIS                                                         */
/* ========================================================================= */

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

export async function getCategoryById(id: string | number): Promise<Category | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const all = await getCategories();
      return all.find((c) => c.id.toString() === id.toString()) || null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(`Error fetching category #${id}:`, err);
    return null;
  }
}

export async function saveWorkoutLogs(logs: WorkoutLogEntry[]): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/workout-logs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ logs }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Gagal menyimpan catatan latihan ke database.',
      };
    }

    return {
      success: true,
      message: data.message || 'Catatan hipertrofi berhasil disimpan!',
    };
  } catch (err: any) {
    console.error('Error saving workout logs:', err);
    return {
      success: false,
      message: err.message || 'Koneksi ke backend Laravel terputus.',
    };
  }
}

export async function createExercise(categoryId: number, name: string) {
  try {
    const res = await fetch(`${API_BASE}/exercises`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        category_id: categoryId,
        name,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating exercise:', err);
    return null;
  }
}

export async function getWorkoutHistory(): Promise<WorkoutLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/workout-logs`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching workout history:', err);
    return [];
  }
}

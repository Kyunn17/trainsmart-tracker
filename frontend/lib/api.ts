import {
  Category,
  WorkoutLogEntry,
  User,
  ClientProgressResponse,
  Split,
  Exercise,
  ExerciseFilters,
  PaginatedExercisesResponse,
  UserPlan,
  ScheduleWarning,
  SaveUserPlanPayload,
  DailySession,
  DailySessionStatus,
  TodaySessionResponse,
  WeeklyEvaluationResponse,
  CoachingRequest,
  TrainerClientTodayResponse,
  AdminExercisePayload,
  ExerciseImage,
  CustomExercisePayload,
  MyExercisesResponse,
} from '@/types/workout';

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

export async function saveWorkoutLogs(
  logs: WorkoutLogEntry[],
  dailySessionId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/workout-logs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        logs,
        ...(dailySessionId ? { daily_session_id: dailySessionId } : {}),
      }),
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

/* ========================================================================= */
/* SPLIT RECOMMENDATIONS & GUIDE APIS                                        */
/* ========================================================================= */

export async function getSplitRecommendations(days: number): Promise<{
  success: boolean;
  data: Split[];
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/splits/recommendations?days=${days}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        data: [],
        message: json.message || 'Gagal memuat rekomendasi split.',
      };
    }
    return {
      success: true,
      data: json.data || [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, data: [], message };
  }
}

export async function getSplitById(id: number): Promise<Split | null> {
  try {
    const res = await fetch(`${API_BASE}/splits/${id}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(`Error fetching split #${id}:`, err);
    return null;
  }
}

/* ========================================================================= */
/* EXERCISE LIBRARY APIS                                                     */
/* ========================================================================= */

export async function getExercises(
  filters: ExerciseFilters = {}
): Promise<PaginatedExercisesResponse> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.muscle) params.set('muscle', filters.muscle);
  if (filters.muscle_region) params.set('muscle_region', filters.muscle_region);
  if (filters.equipment) params.set('equipment', filters.equipment);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.beginner_only) params.set('beginner_only', '1');
  if (filters.session_type) params.set('session_type', filters.session_type);
  if (filters.scope && filters.scope !== 'all') params.set('scope', filters.scope);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE}/exercises?${queryString}`
    : `${API_BASE}/exercises`;

  try {
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Gagal memuat daftar gerakan.');
    }
    return {
      status: json.status || 'success',
      data: json.data || [],
      meta: json.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 24,
        total: 0,
      },
    };
  } catch (err) {
    console.error('Error fetching exercises:', err);
    throw err;
  }
}

export async function getExerciseDetail(
  idOrSlug: string | number
): Promise<Exercise | null> {
  try {
    const res = await fetch(`${API_BASE}/exercises/${idOrSlug}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(`Error fetching exercise ${idOrSlug}:`, err);
    return null;
  }
}

/* ========================================================================= */
/* USER PLAN & WEEKLY SCHEDULE BUILDER APIS                                  */
/* ========================================================================= */

export async function getUserPlan(): Promise<{
  success: boolean;
  data: UserPlan | null;
  warnings: ScheduleWarning[];
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/user/plan`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        data: null,
        warnings: [],
        message: json.message || 'Gagal memuat rencana latihan.',
      };
    }
    return {
      success: true,
      data: json.data || null,
      warnings: json.warnings || [],
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, data: null, warnings: [], message };
  }
}

export async function saveUserPlan(payload: SaveUserPlanPayload): Promise<{
  success: boolean;
  message: string;
  data?: UserPlan;
  warnings: ScheduleWarning[];
}> {
  try {
    const res = await fetch(`${API_BASE}/user/plan`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: json.message || 'Gagal menyimpan jadwal latihan.',
        warnings: [],
      };
    }
    return {
      success: true,
      message: json.message || 'Rencana latihan berhasil disimpan.',
      data: json.data,
      warnings: json.warnings || [],
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message, warnings: [] };
  }
}

export async function validateUserSchedule(
  payload: SaveUserPlanPayload
): Promise<ScheduleWarning[]> {
  try {
    const res = await fetch(`${API_BASE}/user/plan/validate-schedule`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.warnings || [];
  } catch {
    return [];
  }
}

/* ========================================================================= */
/* DAILY SESSIONS & WEEKLY EVALUATION APIS                                   */
/* ========================================================================= */

export async function getTodaySession(): Promise<TodaySessionResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/daily-sessions/today`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDailySessionById(
  id: number | string
): Promise<DailySession | null> {
  try {
    const res = await fetch(`${API_BASE}/daily-sessions/${id}`, {
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

export async function updateDailySessionStatus(
  id: number,
  status: DailySessionStatus
): Promise<{ success: boolean; message: string; data?: DailySession; conflict?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/daily-sessions/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        conflict: res.status === 409,
        message: json.message || 'Gagal memperbarui status sesi.',
      };
    }
    return {
      success: true,
      message: json.message || 'Status diperbarui.',
      data: json.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message };
  }
}

export async function getWeeklyEvaluation(
  period: 'last_week' | 'current_week' = 'last_week'
): Promise<{ success: boolean; data?: WeeklyEvaluationResponse; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/evaluation/weekly?period=${period}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: json.message || 'Gagal memuat evaluasi mingguan.',
      };
    }
    return {
      success: true,
      data: json.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message };
  }
}

/* ========================================================================= */
/* PHASE 7: COACHING REQUESTS & TRAINER DAILY OVERRIDE                       */
/* ========================================================================= */

export async function getClientCoachingRequests(): Promise<CoachingRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/client/coaching-requests`, {
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

export async function createCoachingRequest(
  trainerId: number,
  message?: string
): Promise<{ success: boolean; message: string; data?: CoachingRequest }> {
  try {
    const res = await fetch(`${API_BASE}/client/coaching-requests`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ trainer_id: trainerId, message: message || null }),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Permintaan bimbingan diproses.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function getTrainerCoachingRequests(): Promise<CoachingRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/trainer/coaching-requests`, {
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

export async function respondCoachingRequest(
  requestId: number,
  status: 'accepted' | 'rejected'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/trainer/coaching-requests/${requestId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Permintaan berhasil diperbarui.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function getTrainerClientToday(
  clientId: number
): Promise<TrainerClientTodayResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/trainer/clients/${clientId}/today`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function overrideTrainerClientDailySession(
  clientId: number,
  date: string,
  status: DailySessionStatus,
  trainerNote: string
): Promise<{ success: boolean; message: string; data?: DailySession }> {
  try {
    const res = await fetch(
      `${API_BASE}/trainer/clients/${clientId}/daily-sessions/${date}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status, trainer_note: trainerNote }),
      }
    );
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Status harian klien diperbarui.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

/* ========================================================================= */
/* PHASE 8: ADMIN EXERCISE & SPLIT MANAGEMENT                                */
/* ========================================================================= */

export async function getAdminExercises(params: {
  search?: string;
  muscle?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending_custom' | 'rejected_custom' | 'custom' | 'official';
  page?: number;
  per_page?: number;
} = {}): Promise<PaginatedExercisesResponse> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.muscle) qs.set('muscle', params.muscle);
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));

  const res = await fetch(`${API_BASE}/admin/exercises?${qs.toString()}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Gagal memuat gerakan admin.');
  }
  return {
    status: 'success',
    data: json.data || [],
    meta: json.meta || { current_page: 1, last_page: 1, per_page: 20, total: 0 },
  };
}

export async function createAdminExercise(
  payload: AdminExercisePayload
): Promise<{ success: boolean; message: string; data?: Exercise }> {
  try {
    const res = await fetch(`${API_BASE}/admin/exercises`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gerakan diproses.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function updateAdminExercise(
  id: number,
  payload: Partial<AdminExercisePayload>
): Promise<{ success: boolean; message: string; data?: Exercise }> {
  try {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gerakan diperbarui.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function uploadAdminExerciseImage(
  exerciseId: number,
  file: File,
  position: 0 | 1,
  altText?: string
): Promise<{ success: boolean; message: string; data?: ExerciseImage }> {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('position', String(position));
    if (altText) formData.append('alt_text', altText);

    const res = await fetch(`${API_BASE}/admin/exercises/${exerciseId}/images`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gambar diunggah.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar.';
    return { success: false, message: msg };
  }
}

export async function deleteAdminExerciseImage(
  exerciseId: number,
  imageId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/exercises/${exerciseId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gambar dihapus.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus gambar.';
    return { success: false, message: msg };
  }
}

export async function getAdminSplits(): Promise<Split[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/splits`, {
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

export async function updateAdminSplit(
  id: number,
  payload: Partial<Split>
): Promise<{ success: boolean; message: string; data?: Split }> {
  try {
    const res = await fetch(`${API_BASE}/admin/splits/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Split diperbarui.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui split.';
    return { success: false, message: msg };
  }
}

export async function reviewAdminCustomExercise(
  id: number,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ success: boolean; message: string; data?: Exercise }> {
  try {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        action,
        ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
      }),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Review gerakan diproses.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses review gerakan.';
    return { success: false, message: msg };
  }
}

export async function promoteAdminCustomExercise(
  id: number
): Promise<{ success: boolean; message: string; data?: Exercise }> {
  try {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}/promote`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gerakan dipromosikan ke library resmi.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mempromosikan gerakan.';
    return { success: false, message: msg };
  }
}

/* ========================================================================= */
/* USER CUSTOM EXERCISES (/api/my-exercises)                                 */
/* ========================================================================= */

export async function getMyExercises(): Promise<MyExercisesResponse> {
  const res = await fetch(`${API_BASE}/my-exercises`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Gagal memuat daftar gerakan custom Anda.');
  }
  return {
    status: json.status || 'success',
    data: json.data || [],
    meta: json.meta || { total: 0, pending_count: 0, max_pending: 5 },
  };
}

export async function createCustomExercise(
  payload: CustomExercisePayload
): Promise<{
  success: boolean;
  message: string;
  data?: Exercise;
  errors?: Record<string, string[]>;
}> {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('primary_muscle', payload.primary_muscle);
    if (payload.muscle_region) formData.append('muscle_region', payload.muscle_region);
    formData.append('equipment', payload.equipment);
    if (payload.movement_pattern) formData.append('movement_pattern', payload.movement_pattern);
    if (payload.difficulty) formData.append('difficulty', payload.difficulty);
    if (payload.notes) formData.append('notes', payload.notes);
    (payload.instructions || []).forEach((step, idx) => {
      formData.append(`instructions[${idx}]`, step);
    });
    (payload.common_mistakes || []).forEach((item, idx) => {
      formData.append(`common_mistakes[${idx}]`, item);
    });
    (payload.session_types || []).forEach((st, idx) => {
      formData.append(`session_types[${idx}]`, st);
    });
    if (payload.image) {
      formData.append('image', payload.image);
    }

    const res = await fetch(`${API_BASE}/my-exercises`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      const firstFieldErr = json.errors
        ? (Object.values(json.errors)[0] as string[])?.[0]
        : null;
      return {
        success: false,
        message: firstFieldErr || json.message || 'Gagal mengajukan gerakan custom.',
        errors: json.errors,
      };
    }
    return {
      success: true,
      message: json.message || 'Gerakan custom berhasil diajukan.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function updateCustomExercise(
  id: number,
  payload: Partial<CustomExercisePayload>
): Promise<{ success: boolean; message: string; data?: Exercise }> {
  try {
    const res = await fetch(`${API_BASE}/my-exercises/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      const firstFieldErr = json.errors
        ? (Object.values(json.errors)[0] as string[])?.[0]
        : null;
      return {
        success: false,
        message: firstFieldErr || json.message || 'Gagal memperbarui gerakan custom.',
      };
    }
    return {
      success: true,
      message: json.message || 'Gerakan custom diperbarui.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
    return { success: false, message: msg };
  }
}

export async function deleteCustomExercise(
  id: number
): Promise<{ success: boolean; archived?: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/my-exercises/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await res.json();
    return {
      success: res.ok,
      archived: json.archived,
      message: json.message || 'Gerakan custom dihapus.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus gerakan custom.';
    return { success: false, message: msg };
  }
}

export async function uploadCustomExerciseImage(
  exerciseId: number,
  file: File,
  position: 0 | 1
): Promise<{ success: boolean; message: string; data?: ExerciseImage }> {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('position', String(position));

    const res = await fetch(`${API_BASE}/my-exercises/${exerciseId}/images`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gambar berhasil diunggah.',
      data: json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar.';
    return { success: false, message: msg };
  }
}

export async function deleteCustomExerciseImage(
  exerciseId: number,
  imageId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/my-exercises/${exerciseId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );
    const json = await res.json();
    return {
      success: res.ok,
      message: json.message || 'Gambar berhasil dihapus.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus gambar.';
    return { success: false, message: msg };
  }
}

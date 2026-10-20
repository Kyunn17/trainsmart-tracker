import { Category, WorkoutLogEntry } from '@/types/workout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Fetch all categories with exercises
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

/**
 * Fetch single category by ID with its exercises and recent logs
 */
export async function getCategoryById(id: string | number): Promise<Category | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      // Fallback: try fetching all and filtering if single endpoint fails
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

/**
 * Save batch workout logs to backend
 */
export async function saveWorkoutLogs(logs: WorkoutLogEntry[]): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/workout-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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

/**
 * Add a new custom exercise to a category
 */
export async function createExercise(categoryId: number, name: string) {
  try {
    const res = await fetch(`${API_BASE}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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

/**
 * Get recent workout logs history
 */
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

export interface WorkoutLogEntry {
  id?: number;
  user_id?: number | null;
  exercise_id: number;
  exercise?: Exercise;
  set_number: number;
  weight: number | string;
  reps: number | string;
  rir?: number | null; // Reps In Reserve (0 = Failure, 1 = 1 rep before failure, etc.)
  rpe?: number | null; // Rate of Perceived Exertion
  notes?: string | null;
  created_at?: string;
}

export interface SetData {
  weight: string;
  reps: string;
  rir: number; // Default: 1-2 (optimal hypertrophy range)
  rpe?: number;
  notes?: string;
  isCompleted: boolean;
}

export interface Exercise {
  id: number;
  category_id?: number;
  name: string;
  targetSets?: number;
  setsData?: SetData[];
  workout_logs?: WorkoutLogEntry[];
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  exercises: Exercise[];
}

export type UserRole = "admin" | "trainer" | "client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  trainer_id?: number | null;
  phone?: string | null;
  specialization?: string | null;
  trainer?: User | null;
  clients?: User[];
  clients_count?: number;
  workout_logs_count?: number;
  workout_logs?: WorkoutLogEntry[];
  created_at?: string;
}

export interface ClientProgressSummary {
  total_sets: number;
  total_volume_kg: number;
  average_rir: number | null;
}

export interface ClientProgressResponse {
  client: User;
  summary: ClientProgressSummary;
  data: WorkoutLogEntry[];
}


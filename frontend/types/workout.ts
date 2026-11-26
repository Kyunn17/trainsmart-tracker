export interface ExerciseImage {
  id: number;
  exercise_id: number;
  path: string;
  url: string;
  position: number;
  alt_text?: string | null;
}

export interface WorkoutLogEntry {
  id?: number;
  user_id?: number | null;
  exercise_id: number;
  daily_session_id?: number | null;
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

export interface ExercisePivot {
  is_default_recommended: boolean;
  default_sets: number;
  default_rep_range: string;
  sort_order: number;
}

export interface Exercise {
  id: number;
  category_id?: number | null;
  name: string;
  slug?: string | null;
  primary_muscle?: string | null;
  secondary_muscles?: string[] | null;
  equipment?: string | null;
  movement_pattern?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | string;
  is_beginner_friendly?: boolean;
  instructions?: string[] | null;
  common_mistakes?: string[] | null;
  tips?: string[] | null;
  video_url?: string | null;
  is_active?: boolean;
  images?: ExerciseImage[];
  pivot?: ExercisePivot;
  split_sessions?: SplitSession[];
  targetSets?: number;
  setsData?: SetData[];
  workout_logs?: WorkoutLogEntry[];
  notes?: string;
}

export interface SplitSession {
  id: number;
  split_id: number;
  slug: string;
  name: string;
  session_type: string;
  muscle_groups: string[];
  default_day_of_week?: number | null;
  sort_order: number;
  exercises?: Exercise[];
}

export interface Split {
  id: number;
  slug: string;
  name: string;
  description: string;
  min_days: number;
  max_days: number;
  pros: string[];
  cons: string[];
  suitable_for: string;
  is_active: boolean;
  sort_order: number;
  sessions?: SplitSession[];
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

export interface ExerciseFilters {
  search?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  beginner_only?: boolean;
  session_type?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedExercisesResponse {
  status: string;
  data: Exercise[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PlanScheduleItem {
  id?: number;
  user_plan_id?: number;
  day_of_week: number; // 1 = Senin .. 7 = Minggu
  split_session_id: number | null;
  split_session?: SplitSession | null;
}

export interface ScheduleWarning {
  code: string;
  severity: "warning" | "info";
  message: string;
  days: number[];
}

export interface UserPlan {
  id: number;
  user_id: number;
  split_id: number;
  days_per_week: number;
  is_active: boolean;
  onboarding_completed_at?: string | null;
  split?: Split;
  schedules?: PlanScheduleItem[];
}

export interface SaveUserPlanPayload {
  split_id: number;
  days_per_week: number;
  schedule: Array<{
    day_of_week: number;
    split_session_id: number | null;
  }>;
}

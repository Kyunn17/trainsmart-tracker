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
  user_id?: number | null;
  name: string;
  slug?: string | null;
  primary_muscle?: string | null;
  muscle_region?: string | null;
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
  is_custom?: boolean;
  approval_status?: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  source?: string | null;
  workout_logs_count?: number;
  creator?: { id: number; name: string; email?: string; role: UserRole } | null;
  images?: ExerciseImage[];
  pivot?: ExercisePivot;
  split_sessions?: SplitSession[];
  targetSets?: number;
  setsData?: SetData[];
  workout_logs?: WorkoutLogEntry[];
  notes?: string;
}

export type RecommendationLevel = "recommended" | "alternative" | "not_recommended";

export interface SplitSession {
  id: number;
  split_id: number;
  slug: string;
  name: string;
  session_type: string;
  muscle_groups: string[];
  muscle_regions?: string[] | null;
  is_heavy?: boolean;
  default_day_of_week?: number | null;
  sort_order: number;
  exercises?: Exercise[];
}

export interface Split {
  id: number;
  slug: string;
  name: string;
  description: string;
  days_per_week?: number;
  recommendation_level?: RecommendationLevel;
  min_days: number;
  max_days: number;
  pros: string[];
  cons: string[];
  suitable_for: string;
  not_recommended_reason?: string | null;
  muscle_frequency?: Record<string, number>;
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
  muscle_region?: string;
  equipment?: string;
  difficulty?: string;
  beginner_only?: boolean;
  session_type?: string;
  scope?: "all" | "official" | "custom";
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
    pending_custom_count?: number;
  };
}

export interface CustomExercisePayload {
  name: string;
  primary_muscle: string;
  muscle_region?: string | null;
  equipment: string;
  movement_pattern?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
  instructions?: string[];
  common_mistakes?: string[];
  notes?: string;
  session_types?: string[];
  image?: File | null;
}

export interface MyExercisesResponse {
  status: string;
  data: Exercise[];
  meta: {
    total: number;
    pending_count: number;
    max_pending: number;
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

export type DailySessionStatus = "pending" | "done" | "skipped" | "rest";

export interface DailySession {
  id: number;
  user_id: number;
  user_plan_id?: number | null;
  split_session_id?: number | null;
  session_date: string;
  rescheduled_from_date?: string | null;
  rescheduled_to_date?: string | null;
  status: DailySessionStatus;
  trainer_note?: string | null;
  reschedule_reason?: string | null;
  changed_by?: number | null;
  changed_by_role?: string | null;
  changedBy?: { id: number; name: string; role: UserRole } | null;
  completed_at?: string | null;
  user_plan?: UserPlan | null;
  split_session?: SplitSession | null;
  workout_logs?: WorkoutLogEntry[];
}

export interface WeekOverviewDay {
  day_of_week: number;
  day_short: string;
  date: string;
  is_today: boolean;
  session_name: string;
  status: DailySessionStatus;
  rescheduled_from_date?: string | null;
  rescheduled_to_date?: string | null;
  reschedule_reason?: string | null;
}

export interface UpcomingScheduleOption {
  date: string;
  day_short: string;
  day_name: string;
  session_name: string;
  is_rest: boolean;
  is_locked: boolean;
}

export interface TodaySessionResponse {
  status: string;
  has_plan: boolean;
  data: DailySession | null;
  week_overview: WeekOverviewDay[];
  upcoming_options?: UpcomingScheduleOption[];
}

export interface WeeklyEvaluationSuggestion {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  action_href?: string;
  action_label?: string;
}

export interface WeeklyEvaluationDay {
  day_of_week: number;
  day_name: string;
  date: string;
  session_name: string;
  status: DailySessionStatus;
  sets_logged: number;
  tonnage_kg: number;
}

export interface WeeklyEvaluationResponse {
  period: "last_week" | "current_week";
  period_start: string;
  period_end: string;
  has_plan: boolean;
  split_name?: string | null;
  scheduled_sessions: number;
  completed_sessions: number;
  skipped_sessions: number;
  completion_percentage: number;
  total_sets: number;
  total_tonnage_kg: number;
  previous_week_tonnage_kg: number;
  tonnage_change_kg: number;
  tonnage_change_percentage: number | null;
  average_rir: number | null;
  daily_breakdown: WeeklyEvaluationDay[];
  suggestions: WeeklyEvaluationSuggestion[];
}

export interface CoachingRequest {
  id: number;
  client_id: number;
  trainer_id: number;
  status: "pending" | "accepted" | "rejected";
  message?: string | null;
  responded_at?: string | null;
  created_at?: string;
  trainer?: Pick<User, "id" | "name" | "email" | "specialization">;
  client?: Pick<User, "id" | "name" | "email" | "phone">;
}

export interface TrainerClientTodayResponse {
  status: string;
  has_plan: boolean;
  client: Pick<User, "id" | "name" | "email">;
  split_name?: string | null;
  data: DailySession | null;
}

export interface AdminExercisePayload {
  name: string;
  primary_muscle?: string | null;
  muscle_region?: string | null;
  equipment?: string | null;
  movement_pattern?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
  is_beginner_friendly?: boolean;
  instructions?: string[];
  common_mistakes?: string[];
  tips?: string[];
  is_active?: boolean;
  split_session_ids?: number[];
}

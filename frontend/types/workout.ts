export interface WorkoutLogEntry {
  id?: number;
  exercise_id: number;
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

export interface WorkoutSessionSummary {
  categoryName: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // kg lifted
  completedExercisesCount: number;
  averageRir: number;
  logs: WorkoutLogEntry[];
}

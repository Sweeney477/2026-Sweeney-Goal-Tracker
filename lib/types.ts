export interface Profile {
  id: string
  user_id: string
  timezone?: string | null
  units?: 'metric' | 'imperial' | null
  calorie_goal?: number | null
  step_goal?: number | null
  coding_goal_minutes?: number | null
  onboarding_completed_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface Goal {
  id: string
  user_id: string
  title: string
  category: string
  target?: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at?: string
}

export interface GoalPlan {
  id: string
  goal_id: string
  plan_json: TrackingPlan
  model?: string
  created_at: string
}

export interface TrackingPlan {
  lagging_metric?: string
  leading_metrics?: string[]
  cadence: 'daily' | 'weekly'
  checkin_types?: ('number' | 'checklist' | 'photo' | 'timer')[]
  minimum_viable_day?: string
  weekly_review_prompt?: string
  reminder_suggestions?: string[]
  milestones?: TrackingMilestone[]
}

export interface TrackingMilestone {
  title: string
  timeframe?: string
  actions?: string[]
  success_criteria?: string
}

export interface Checkin {
  id: string
  user_id: string
  date: string
  type: 'weight' | 'steps' | 'calories' | 'coding_minutes' | 'workout'
  value_json: Record<string, any>
  notes?: string
  created_at: string
}

export interface Photo {
  id: string
  user_id: string
  date: string
  kind: 'front' | 'side' | 'back'
  storage_path: string
  notes?: string
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  consumed_at: string
  name?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  notes?: string
  photo_path?: string
  ai_estimate?: Record<string, any>
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  date: string
  workout_type: string
  duration_min?: number
  notes?: string
  volume_json?: WorkoutVolume
  created_at: string
  updated_at?: string
}

export interface WorkoutSet {
  weight?: number | null
  reps?: number | null
  rpe?: number | null
  notes?: string | null
}

export interface WorkoutExercise {
  name: string
  lift_type?: string | null
  equipment?: string | null
  sets: WorkoutSet[]
  library_id?: string | null
}

export interface WorkoutVolume {
  exercises: WorkoutExercise[]
}

export interface ExerciseLibrary {
  id: string
  user_id: string
  name: string
  lift_type?: string | null
  equipment?: string | null
  is_favorite?: boolean
  last_used_at?: string | null
  created_at: string
  updated_at?: string
}

export interface ProjectMilestone {
  id: string
  label: string
  completed: boolean
  completed_at?: string
}

export interface Project {
  id: string
  user_id: string
  week_start: string
  name: string
  status: 'planning' | 'in_progress' | 'shipped' | 'paused'
  definition_of_done?: string
  links_json?: Record<string, string>
  milestones_json?: ProjectMilestone[]
  shipped_at?: string
  created_at: string
  updated_at?: string
}

export interface WeeklyReview {
  wins?: string[]
  risks?: string[]
  changes?: string[]
  next_week_plan?: string[]
  priority_goal?: string
}


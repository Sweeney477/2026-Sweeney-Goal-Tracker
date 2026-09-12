import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workout } from '@/lib/types'

export async function listRecentWorkouts(supabase: SupabaseClient, userId: string, limit = 20) {
  return supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function getWorkoutForDate(supabase: SupabaseClient, userId: string, date: string) {
  return supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
}

export async function listExerciseLibrary(
  supabase: SupabaseClient,
  userId: string,
  opts: { term?: string; limit?: number } = {}
) {
  const limit = opts.limit ?? 50
  let query = supabase
    .from('exercises_library')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (opts.term) {
    query = query.ilike('name', `%${opts.term}%`)
  }

  return query
}

export async function toggleExerciseFavorite(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string,
  isFavorite: boolean
) {
  return supabase
    .from('exercises_library')
    .update({ is_favorite: isFavorite })
    .eq('id', exerciseId)
    .eq('user_id', userId)
}

type WorkoutWritePayload = {
  user_id: string
  date: string
  workout_type?: string
  duration_min?: number | null
  notes?: string | null
  volume_json?: Workout['volume_json'] | null
}

export async function updateWorkout(
  supabase: SupabaseClient,
  workoutId: string,
  payload: WorkoutWritePayload
) {
  return supabase.from('workouts').update(payload).eq('id', workoutId)
}

export async function insertWorkout(supabase: SupabaseClient, payload: WorkoutWritePayload) {
  return supabase.from('workouts').insert(payload).select('id').single()
}

export async function upsertWorkout(supabase: SupabaseClient, payload: WorkoutWritePayload) {
  return supabase.from('workouts').upsert(payload).select('*').maybeSingle()
}

export async function deleteWorkout(supabase: SupabaseClient, userId: string, workoutId: string) {
  return supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', userId)
}

export async function upsertWorkoutCheckin(
  supabase: SupabaseClient,
  payload: {
    user_id: string
    date: string
    type: string
    value_json: Record<string, unknown>
    notes?: string | null
  }
) {
  return supabase.from('checkins').upsert(payload)
}

export async function upsertExercisesLibrary(
  supabase: SupabaseClient,
  rows: Array<{
    user_id: string
    name: string
    lift_type?: string | null
    equipment?: string | null
    last_used_at: string
  }>
) {
  return supabase.from('exercises_library').upsert(rows, { onConflict: 'user_id,name' })
}

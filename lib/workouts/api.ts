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

export async function listExerciseLibrary(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('exercise_library')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
}

export async function upsertWorkout(
  supabase: SupabaseClient,
  payload: Partial<Workout> & { user_id: string; date: string }
) {
  return supabase.from('workouts').upsert(payload).select('*').maybeSingle()
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Meal } from '@/lib/types'

export type MealWritePayload = {
  consumed_at: string
  name?: string | null
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  notes?: string | null
  photo_path?: string | null
  ai_estimate?: Record<string, unknown> | null
}

export async function listRecentMeals(
  supabase: SupabaseClient,
  userId: string,
  opts: { from?: number; to?: number } = {}
) {
  const from = opts.from ?? 0
  const to = opts.to ?? 9
  return supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('consumed_at', { ascending: false })
    .range(from, to)
}

export async function insertMeal(
  supabase: SupabaseClient,
  payload: MealWritePayload & { user_id: string }
) {
  return supabase.from('meals').insert(payload)
}

export async function updateMeal(
  supabase: SupabaseClient,
  mealId: string,
  userId: string,
  patch: MealWritePayload
) {
  return supabase.from('meals').update(patch).eq('id', mealId).eq('user_id', userId)
}

export async function deleteMeal(supabase: SupabaseClient, userId: string, mealId: string) {
  return supabase.from('meals').delete().eq('id', mealId).eq('user_id', userId)
}

export async function createMealPhotoSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600
) {
  return supabase.storage.from('meal-photos').createSignedUrl(storagePath, expiresIn)
}

export async function uploadMealPhoto(supabase: SupabaseClient, path: string, file: File) {
  return supabase.storage.from('meal-photos').upload(path, file)
}

export async function removeMealPhotos(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return { data: null, error: null }
  return supabase.storage.from('meal-photos').remove(paths)
}

export async function getCalorieGoal(supabase: SupabaseClient, userId: string) {
  return supabase.from('profiles').select('calorie_goal').eq('user_id', userId).single()
}

export type MealWithUrl = Meal & { signedUrl?: string | null }

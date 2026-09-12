import type { SupabaseClient } from '@supabase/supabase-js'

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

export async function deleteMeal(supabase: SupabaseClient, userId: string, mealId: string) {
  return supabase.from('meals').delete().eq('id', mealId).eq('user_id', userId)
}

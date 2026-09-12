import type { SupabaseClient } from '@supabase/supabase-js'
import type { Checkin } from '@/lib/types'
import type { CheckinType } from '@/lib/config/trackers'

export async function listRecentCheckins(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
) {
  return supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
}

export async function listMealSuggestions(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
) {
  return supabase
    .from('meals')
    .select('name, calories, consumed_at')
    .eq('user_id', userId)
    .order('consumed_at', { ascending: false })
    .limit(limit)
}

export async function listProjectSuggestions(
  supabase: SupabaseClient,
  userId: string,
  limit = 5
) {
  return supabase
    .from('projects')
    .select('name, status, week_start')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit)
}

export async function upsertCheckin(
  supabase: SupabaseClient,
  payload: {
    user_id: string
    date: string
    type: CheckinType
    value_json: Checkin['value_json']
    notes?: string | null
  }
) {
  return supabase.from('checkins').upsert(payload)
}

export async function insertMeal(
  supabase: SupabaseClient,
  payload: {
    user_id: string
    consumed_at: string
    name: string
    calories?: number | null
    notes?: string | null
  }
) {
  return supabase.from('meals').insert(payload)
}

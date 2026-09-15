/**
 * Shared one-field quick-log saves for weight / steps / coding.
 * Used by Today sheet and kept aligned with Log (`use-checkins`) validators.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkinTypeForTile } from '@/lib/checkins/domain'
import { upsertCheckin } from '@/lib/checkins/api'
import type { QuickLogTileId } from '@/lib/config/trackers'

/** Metrics that fit a lightweight Today sheet (v1). */
export type QuickLogMetricId = Extract<QuickLogTileId, 'weight' | 'steps' | 'code'>

export const QUICK_LOG_METRICS: readonly QuickLogMetricId[] = ['weight', 'steps', 'code']

export function isQuickLogMetric(id: string): id is QuickLogMetricId {
  return (QUICK_LOG_METRICS as readonly string[]).includes(id)
}

export type QuickLogSaveInput = {
  userId: string
  /** Local calendar day `yyyy-MM-dd` — same rule as Log. Optional for #13 catch-up. */
  date: string
  metric: QuickLogMetricId
  /** Primary numeric field (weight, steps, or coding minutes). */
  value: string
  /** Coding project name; defaults applied like Log when empty. */
  project?: string
  notes?: string | null
}

export type QuickLogSaveResult = {
  metric: QuickLogMetricId
  /** Stored numeric value (weight / steps / coding minutes). */
  numericValue: number
  project?: string
}

export async function saveQuickLogMetric(
  supabase: SupabaseClient,
  input: QuickLogSaveInput
): Promise<QuickLogSaveResult> {
  const { userId, date, metric, notes } = input

  if (metric === 'weight') {
    const numericValue = parseFloat(input.value || '0')
    if (!numericValue) throw new Error('Enter a weight')
    const { error } = await upsertCheckin(supabase, {
      user_id: userId,
      date,
      type: 'weight',
      value_json: { value: numericValue },
      notes: notes || null,
    })
    if (error) throw error
    return { metric, numericValue }
  }

  if (metric === 'steps') {
    const numericValue = parseInt(input.value || '0', 10)
    if (!numericValue) throw new Error('Enter steps')
    const { error } = await upsertCheckin(supabase, {
      user_id: userId,
      date,
      type: 'steps',
      value_json: { value: numericValue },
      notes: notes || null,
    })
    if (error) throw error
    return { metric, numericValue }
  }

  const numericValue = parseInt(input.value || '0', 10)
  if (!numericValue) throw new Error('Enter coding minutes')
  const project = (input.project || '').trim() || 'Project'
  const { error } = await upsertCheckin(supabase, {
    user_id: userId,
    date,
    type: checkinTypeForTile('code') ?? 'coding_minutes',
    value_json: { value: numericValue, project },
    notes: notes || null,
  })
  if (error) throw error
  return { metric, numericValue, project }
}

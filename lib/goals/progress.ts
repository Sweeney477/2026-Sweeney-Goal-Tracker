import type { Goal } from '@/lib/types'
import { trackers, type QuickLogTileId } from '@/lib/config/trackers'

export type GoalProgress = {
  outcomePercent: number | null
  outcomeLabel: string
  timeElapsedPercent: number | null
  linkedTrackerId: QuickLogTileId | null
}

const CATEGORY_TO_TRACKER: Record<string, QuickLogTileId> = {
  fitness: 'workout',
  health: 'weight',
  weight: 'weight',
  nutrition: 'food',
  food: 'food',
  coding: 'code',
  code: 'code',
  project: 'code',
  steps: 'steps',
}

function parseTargetNumber(target?: string | null): number | null {
  if (!target) return null
  const match = target.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const value = Number(match[0])
  return Number.isFinite(value) ? value : null
}

export function timeElapsedPercent(
  goal: Pick<Goal, 'start_date' | 'end_date'>,
  now = new Date()
): number | null {
  if (!goal.start_date || !goal.end_date) return null
  const start = new Date(goal.start_date).getTime()
  const end = new Date(goal.end_date).getTime()
  if (!(end > start)) return null
  const pct = Math.round(((now.getTime() - start) / (end - start)) * 100)
  return Math.max(0, Math.min(100, pct))
}

export function linkedTrackerForGoal(goal: Pick<Goal, 'category' | 'title'>): QuickLogTileId | null {
  const haystack = `${goal.category || ''} ${goal.title || ''}`.toLowerCase()
  for (const [key, trackerId] of Object.entries(CATEGORY_TO_TRACKER)) {
    if (haystack.includes(key)) return trackerId
  }
  return null
}

/**
 * Outcome progress when a goal maps to a tracker reading + numeric target.
 * Otherwise returns null outcome (UI must not fake a percent).
 */
export function computeGoalProgress(
  goal: Goal,
  latestByTracker: Partial<Record<QuickLogTileId, number | null | undefined>>,
  now = new Date()
): GoalProgress {
  const linkedTrackerId = linkedTrackerForGoal(goal)
  const target = parseTargetNumber(goal.target)
  const latest = linkedTrackerId != null ? latestByTracker[linkedTrackerId] : null

  let outcomePercent: number | null = null
  let outcomeLabel = 'No outcome metric linked'

  if (linkedTrackerId && target != null && latest != null && Number.isFinite(latest)) {
    const tracker = trackers.find((t) => t.id === linkedTrackerId)
    if (linkedTrackerId === 'weight') {
      outcomePercent = null
      outcomeLabel = `Latest ${latest} · target ${target}`
    } else {
      outcomePercent = Math.max(0, Math.min(100, Math.round((Number(latest) / target) * 100)))
      outcomeLabel = `${tracker?.label ?? 'Progress'} ${outcomePercent}% of ${target}`
    }
  } else if (linkedTrackerId && latest != null) {
    outcomeLabel = `Tracking ${
      trackers.find((t) => t.id === linkedTrackerId)?.label ?? 'metric'
    } (set a numeric target)`
  }

  return {
    outcomePercent,
    outcomeLabel,
    timeElapsedPercent: timeElapsedPercent(goal, now),
    linkedTrackerId,
  }
}

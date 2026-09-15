/**
 * Yesterday catch-up helpers for Today (#13).
 * Detect incomplete leading / streak-driving metrics for the prior local day.
 */
import type { Checkin } from '@/lib/types'
import { streakTracker } from '@/lib/config/trackers'
import { localDayKey } from '@/lib/dates'
import { buildDailyWinChecklist } from '@/lib/checkins/domain'
import {
  isQuickLogMetric,
  type QuickLogMetricId,
} from '@/lib/checkins/quick-log'

/** Local calendar day key for the day before `today` in `timeZone`. */
export function yesterdayDayKey(
  timeZone: string,
  today: string = localDayKey(timeZone)
): string {
  const y = new Date(`${today}T12:00:00Z`)
  y.setUTCDate(y.getUTCDate() - 1)
  return localDayKey(timeZone, y)
}

export type YesterdayCatchUpInfo = {
  yesterday: string
  /** Preferred metric to open first (streak type when incomplete, else next sheetable). */
  preferredMetric: QuickLogMetricId
  /** Incomplete weight / steps / coding for yesterday, checklist order. */
  incompleteMetrics: QuickLogMetricId[]
}

export type ResolveYesterdayCatchUpOptions = {
  /**
   * Dates (yyyy-MM-dd) where the streak-driving metric was logged.
   * Used so brand-new accounts don’t see a false “finish yesterday” prompt.
   */
  priorStreakDates?: string[]
}

/**
 * Returns catch-up info when yesterday has incomplete sheetable leading metrics
 * and recovery is useful (partial yesterday, or streak metric at risk with history).
 * Food / workout remain full-log only and do not trigger the banner alone.
 */
export function resolveYesterdayCatchUp(
  checkins: Checkin[],
  yesterday: string,
  options: ResolveYesterdayCatchUpOptions = {}
): YesterdayCatchUpInfo | null {
  const checklist = buildDailyWinChecklist(checkins, yesterday)
  const incompleteMetrics = checklist
    .filter((item) => !item.done && isQuickLogMetric(item.id))
    .map((item) => item.id as QuickLogMetricId)

  if (!incompleteMetrics.length) return null

  const streakId = streakTracker()?.id
  const streakIncomplete =
    Boolean(streakId) &&
    isQuickLogMetric(streakId!) &&
    incompleteMetrics.includes(streakId as QuickLogMetricId)

  const startedYesterday = checkins.length > 0
  const hadStreakHistory = (options.priorStreakDates || []).some((d) => d < yesterday)
  const recoveryUseful = startedYesterday || (streakIncomplete && hadStreakHistory)
  if (!recoveryUseful) return null

  const preferredMetric =
    streakId && isQuickLogMetric(streakId) && incompleteMetrics.includes(streakId)
      ? streakId
      : incompleteMetrics[0]

  return {
    yesterday,
    preferredMetric,
    incompleteMetrics,
  }
}

/** localStorage key: dismissed for the rest of the user's local day. */
export function yesterdayCatchUpDismissKey(userId: string, todayLocalDay: string): string {
  return `goal:yesterday-catchup-dismissed:${userId}:${todayLocalDay}`
}

/**
 * Daily tracker definitions for the personal OS.
 *
 * Dashboard tiles, streak rules, and check-in quick-log tiles read from here
 * so forks can rename, reorder, or disable trackers without rewriting pages.
 */
import type { Profile } from '@/lib/types'
import { weightUnitLabel, type UnitSystem } from '@/lib/units'

/** Stored check-in `type` values in Supabase */
export type CheckinType = 'weight' | 'steps' | 'calories' | 'coding_minutes' | 'workout'

/** Quick-log tile ids on /check-ins (food maps to meals + calories) */
export type QuickLogTileId = 'weight' | 'steps' | 'food' | 'workout' | 'code'

export type TrackerDef = {
  id: QuickLogTileId
  /** Underlying checkin type when one exists */
  checkinType?: CheckinType
  label: string
  helper: string
  /** Soft tile wash */
  accent: string
  /** Show on dashboard "today" grid */
  showOnDashboard: boolean
  /** Counts toward daily completion ring */
  countsTowardDailyWin: boolean
  /** Used for streak calculation when enabled */
  streakEligible: boolean
  /** Profile field used as daily target */
  goalKey?: keyof Pick<Profile, 'step_goal' | 'calorie_goal' | 'coding_goal_minutes'>
  /** Query param alias from dashboard deep links */
  queryAliases: string[]
  metricLabel: (units: UnitSystem) => string
  formatDisplay: (value: unknown, units: UnitSystem) => string
}

export const trackers: TrackerDef[] = [
  {
    id: 'weight',
    checkinType: 'weight',
    label: 'Weight',
    helper: 'Log today’s weight',
    accent: 'from-brand/10 to-brand/20',
    showOnDashboard: true,
    countsTowardDailyWin: true,
    streakEligible: true,
    queryAliases: ['weight'],
    metricLabel: (units) => weightUnitLabel(units),
    formatDisplay: (value, units) =>
      value == null || value === '' ? '—' : `${value} ${weightUnitLabel(units)}`,
  },
  {
    id: 'steps',
    checkinType: 'steps',
    label: 'Steps',
    helper: 'Log today’s steps',
    accent: 'from-brand/10 to-brand/15',
    showOnDashboard: true,
    countsTowardDailyWin: true,
    streakEligible: false,
    goalKey: 'step_goal',
    queryAliases: ['steps'],
    metricLabel: () => 'steps',
    formatDisplay: (value) =>
      value == null || value === '' ? '—' : Number(value).toLocaleString(),
  },
  {
    id: 'food',
    checkinType: 'calories',
    label: 'Food',
    helper: 'Log a meal with calories',
    accent: 'from-brand/5 to-brand/15',
    showOnDashboard: true,
    countsTowardDailyWin: true,
    streakEligible: false,
    goalKey: 'calorie_goal',
    queryAliases: ['calories', 'food'],
    metricLabel: () => 'cal',
    formatDisplay: (value) => (value == null || value === '' ? '—' : String(value)),
  },
  {
    id: 'workout',
    checkinType: 'workout',
    label: 'Workout',
    helper: 'Log today’s workout',
    accent: 'from-brand/10 to-brand/20',
    showOnDashboard: true,
    countsTowardDailyWin: true,
    streakEligible: false,
    queryAliases: ['workout'],
    metricLabel: () => 'type',
    formatDisplay: (value) => (value == null || value === '' ? '—' : String(value)),
  },
  {
    id: 'code',
    checkinType: 'coding_minutes',
    label: 'Coding',
    helper: 'Log coding minutes',
    accent: 'from-brand/10 to-brand/20',
    showOnDashboard: true,
    countsTowardDailyWin: true,
    streakEligible: false,
    goalKey: 'coding_goal_minutes',
    queryAliases: ['coding_minutes', 'code', 'coding'],
    metricLabel: () => 'min',
    formatDisplay: (value) => {
      if (value == null || value === '' || value === 0) return '—'
      const minutes = Number(value)
      if (Number.isNaN(minutes)) return '—'
      return `${(minutes / 60).toFixed(1)} hr`
    },
  },
]

export function dashboardTrackers() {
  return trackers.filter((t) => t.showOnDashboard)
}

export function dailyWinTrackers() {
  return trackers.filter((t) => t.countsTowardDailyWin)
}

export function streakTracker() {
  return trackers.find((t) => t.streakEligible) ?? null
}

export function trackerById(id: QuickLogTileId) {
  return trackers.find((t) => t.id === id)
}

export function trackerFromQuery(type: string | null | undefined): QuickLogTileId | null {
  if (!type) return null
  const normalized = type.toLowerCase()
  const match = trackers.find((t) => t.queryAliases.includes(normalized) || t.id === normalized)
  return match?.id ?? null
}

export function focusTileIds(): QuickLogTileId[] {
  // Match dashboard checklist / summary tiles
  return trackers.filter((t) => t.countsTowardDailyWin).map((t) => t.id)
}

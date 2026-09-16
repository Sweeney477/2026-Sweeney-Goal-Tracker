/**
 * Weekly review ritual helpers (#14).
 * Sunday detection + local persistence for “week closed” without nagging.
 */
import { localDayKey, weekStartKey } from '@/lib/dates'

export type WeeklyRitualAnswers = {
  wentWell: string
  adjust: string
  note: string
}

export type ClosedWeeklyRitual = WeeklyRitualAnswers & {
  weekStart: string
  closedAt: string
}

/** True when `instant` falls on Sunday in `timeZone`. */
export function isLocalSunday(
  timeZone: string,
  instant: Date = new Date()
): boolean {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    }).format(instant)
    return weekday === 'Sun'
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
    }).format(instant) === 'Sun'
  }
}

/** Monday key for the week containing `dayKey` (yyyy-MM-dd). */
export function ritualWeekStart(dayKey: string, timeZone: string): string {
  return weekStartKey(dayKey, timeZone)
}

export function weekClosedStorageKey(userId: string, weekStart: string): string {
  return `goal:weekly-review-closed:${userId}:${weekStart}`
}

/** Session flag so Today can show “Week closed” after client navigation/reload. */
export function weekClosedToastKey(): string {
  return 'goal:weekly-review-just-closed'
}

export function readClosedWeeklyRitual(
  userId: string,
  weekStart: string
): ClosedWeeklyRitual | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(weekClosedStorageKey(userId, weekStart))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ClosedWeeklyRitual>
    if (!parsed || parsed.weekStart !== weekStart) return null
    if (typeof parsed.wentWell !== 'string' || typeof parsed.adjust !== 'string') return null
    return {
      weekStart,
      wentWell: parsed.wentWell,
      adjust: parsed.adjust,
      note: typeof parsed.note === 'string' ? parsed.note : '',
      closedAt: typeof parsed.closedAt === 'string' ? parsed.closedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writeClosedWeeklyRitual(
  userId: string,
  weekStart: string,
  answers: WeeklyRitualAnswers
): ClosedWeeklyRitual {
  const record: ClosedWeeklyRitual = {
    weekStart,
    wentWell: answers.wentWell.trim(),
    adjust: answers.adjust.trim(),
    note: answers.note.trim(),
    closedAt: new Date().toISOString(),
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(weekClosedStorageKey(userId, weekStart), JSON.stringify(record))
    } catch {
      /* ignore quota / private mode */
    }
  }
  return record
}

export function markWeekClosedToastPending(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(weekClosedToastKey(), '1')
  } catch {
    /* ignore */
  }
}

/** Consume pending toast flag; returns true once per close. */
export function consumeWeekClosedToastPending(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const key = weekClosedToastKey()
    if (window.sessionStorage.getItem(key) !== '1') return false
    window.sessionStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Whether Today should promote Review as the primary Sunday action. */
export function shouldPromoteSundayReview(opts: {
  isSunday: boolean
  weekAlreadyClosed: boolean
}): boolean {
  return opts.isSunday && !opts.weekAlreadyClosed
}

/** Week label helper for Review header (Mon–Sun of the ritual week). */
export function ritualWeekLabel(weekStart: string, timeZone: string): string {
  try {
    const start = new Date(`${weekStart}T12:00:00Z`)
    if (Number.isNaN(start.getTime())) return 'This week'
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 6)
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
    })
    return `${fmt.format(start)} – ${fmt.format(end)}`
  } catch {
    return 'This week'
  }
}

export function currentRitualWeekStart(
  timeZone: string,
  instant: Date = new Date()
): string {
  return ritualWeekStart(localDayKey(timeZone, instant), timeZone)
}

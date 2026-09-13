/**
 * Shared local-day helpers.
 *
 * Dashboard (server) previously used UTC via format(new Date()), while client
 * views used the browser clock — around midnight that yields “today” vs
 * “yesterday” across screens. Everything that means “today” should go through
 * the profile timezone (fallback: browser / UTC).
 */

export const DEFAULT_TIMEZONE = 'UTC'

/** Best-effort browser timezone; safe on server (returns UTC). */
export function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

export function resolveTimezone(preferred?: string | null): string {
  const trimmed = preferred?.trim()
  if (trimmed) return trimmed
  return detectBrowserTimezone()
}

/**
 * Calendar date (yyyy-MM-dd) for `instant` in `timeZone`.
 * Uses en-CA so Intl returns ISO-like ordering.
 */
export function localDayKey(
  timeZone: string = DEFAULT_TIMEZONE,
  instant: Date = new Date()
): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant)
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant)
  }
}

/** Local wall-clock datetime suitable for `<input type="datetime-local">`. */
export function localDateTimeValue(
  timeZone: string = DEFAULT_TIMEZONE,
  instant: Date = new Date()
): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(instant)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  ) as Record<string, string>

  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`
}

export function formatLocalDay(
  timeZone: string,
  pattern: 'long' | 'medium' | 'weekday' = 'long',
  instant: Date = new Date()
): string {
  const options: Intl.DateTimeFormatOptions =
    pattern === 'long'
      ? { weekday: 'long', month: 'short', day: 'numeric' }
      : pattern === 'weekday'
        ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
        : { month: 'short', day: 'numeric', weekday: 'short' }

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(instant)
  } catch {
    return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIMEZONE, ...options }).format(
      instant
    )
  }
}

/** Monday (yyyy-MM-dd) of the week containing `dayKey` in that timezone. */
export function weekStartKey(dayKey: string, timeZone: string = DEFAULT_TIMEZONE): string {
  // Interpret noon UTC on that calendar day to avoid DST edge flips, then shift
  // by weekday in the target zone via a stable formatter.
  const noon = new Date(`${dayKey}T12:00:00Z`)
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(noon)
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const offset = map[weekday] ?? 0
  const start = new Date(noon)
  start.setUTCDate(start.getUTCDate() - offset)
  return localDayKey(timeZone, start)
}

export function isSameLocalDay(
  dateKey: string,
  timeZone: string,
  instant: Date = new Date()
): boolean {
  return dateKey === localDayKey(timeZone, instant)
}

export function dayRelativeLabel(
  dateKey: string,
  timeZone: string,
  instant: Date = new Date()
): 'Today' | 'Yesterday' | null {
  const today = localDayKey(timeZone, instant)
  if (dateKey === today) return 'Today'
  const y = new Date(`${today}T12:00:00Z`)
  y.setUTCDate(y.getUTCDate() - 1)
  if (dateKey === localDayKey(timeZone, y)) return 'Yesterday'
  return null
}

import { format } from 'date-fns'

/**
 * Consecutive-day streak ending on `today` for a set of ISO date strings (yyyy-MM-dd).
 */
export function calculateDailyStreak(dates: string[], today: string): number {
  if (!dates.length) return 0

  const unique = Array.from(new Set(dates)).sort().reverse()
  let streak = 0
  const cursor = new Date(`${today}T12:00:00`)

  for (const dateStr of unique) {
    if (format(cursor, 'yyyy-MM-dd') === dateStr) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

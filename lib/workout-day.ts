function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type WorkoutAnswer = 'yes' | 'rest' | null

export function workoutAnswerFromValue(value: Record<string, unknown> | null | undefined): WorkoutAnswer {
  if (!value) return null
  if (value.done === true) return 'yes'
  if (value.done === false || value.rest === true) return 'rest'
  // Legacy detailed workout logs still count as Yes
  if (value.type || value.duration_min != null) return 'yes'
  return null
}

/** Consecutive local days with any Yes/Rest answer (missing day breaks streak). */
export function computeWorkoutConsistencyStreak(datesDesc: string[], today: string): number {
  if (!datesDesc.length) return 0

  const set = new Set(datesDesc)
  let streak = 0
  const cursor = new Date(`${today}T12:00:00`)

  while (true) {
    const key = formatLocalDate(cursor)
    if (!set.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function workoutsYesThisWeek(
  rows: { date: string; value_json: Record<string, unknown> }[],
  today: string
): number {
  const end = new Date(`${today}T12:00:00`)
  const start = new Date(end)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // Monday
  const startKey = formatLocalDate(start)

  return rows.filter((row) => {
    if (row.date < startKey || row.date > today) return false
    return workoutAnswerFromValue(row.value_json) === 'yes'
  }).length
}

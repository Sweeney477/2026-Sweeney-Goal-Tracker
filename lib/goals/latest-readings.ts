import type { QuickLogTileId } from '@/lib/config/trackers'

type CheckinLike = {
  type: string
  value_json?: { value?: unknown } | null
}

/**
 * Map recent check-ins into the latest numeric reading per quick-log tracker.
 * Used by dashboard and goals for outcome-honest progress.
 */
export function latestByTrackerFromCheckins(
  checkins: CheckinLike[] | null | undefined
): Partial<Record<QuickLogTileId, number | null>> {
  const rows = checkins || []
  const latestNumeric = (type: string) => {
    const row = rows.find((c) => c.type === type)
    return row?.value_json?.value != null ? Number(row.value_json.value) : null
  }

  return {
    weight: latestNumeric('weight'),
    steps: latestNumeric('steps'),
    food: latestNumeric('calories'),
    code: latestNumeric('coding_minutes'),
    workout: rows.some((c) => c.type === 'workout') ? 1 : null,
  }
}

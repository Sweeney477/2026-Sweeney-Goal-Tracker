import type { Checkin } from '@/lib/types'
import type { QuickLogTileId, CheckinType } from '@/lib/config/trackers'
import { dailyWinTrackers, trackerById } from '@/lib/config/trackers'

export type CheckinTileId = QuickLogTileId

export type CheckinValue = {
  value?: number | string
  name?: string
  type?: string
  duration_min?: number
  project?: string
  [key: string]: unknown
}

export function checkinTypeForTile(tile: CheckinTileId): CheckinType | undefined {
  return trackerById(tile)?.checkinType
}

export function todayTypes(checkins: Checkin[], today: string): Set<string> {
  return new Set(checkins.filter((c) => c.date === today).map((c) => c.type))
}

export function isTileDone(tile: CheckinTileId, types: Set<string>): boolean {
  const checkinType = checkinTypeForTile(tile)
  if (!checkinType) return false
  return types.has(checkinType)
}

export function latestOfType(checkins: Checkin[], type: CheckinType) {
  return checkins.find((c) => c.type === type)
}

export function valueOf(checkin?: Checkin | null): CheckinValue | undefined {
  return checkin?.value_json as CheckinValue | undefined
}

export type DailyWinItem = {
  id: CheckinTileId
  label: string
  href: string
  done: boolean
  helper: string
}

export function buildDailyWinChecklist(checkins: Checkin[], today: string): DailyWinItem[] {
  const types = todayTypes(checkins, today)
  return dailyWinTrackers().map((tracker) => ({
    id: tracker.id,
    label: tracker.label,
    helper: tracker.helper,
    href: `/check-ins?type=${tracker.queryAliases[0] ?? tracker.id}`,
    done: isTileDone(tracker.id, types),
  }))
}

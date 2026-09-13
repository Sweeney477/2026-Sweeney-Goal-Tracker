import { cn } from '@/lib/utils'
import { dayRelativeLabel, formatLocalDay } from '@/lib/dates'

type DayContextProps = {
  timeZone: string
  /** Optional explicit day key (yyyy-MM-dd); defaults to today in timeZone */
  dateKey?: string
  className?: string
  /** When true, show timezone abbreviation for clarity */
  showZone?: boolean
}

function formatKey(dateKey: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${dateKey}T12:00:00Z`))
  } catch {
    return dateKey
  }
}

/**
 * Shared “Today / Yesterday · Sunday, Sep 13” label so every surface
 * shares one date context.
 */
export function DayContext({ timeZone, dateKey, className, showZone }: DayContextProps) {
  const relative = dateKey ? dayRelativeLabel(dateKey, timeZone) : 'Today'
  const label = dateKey ? formatKey(dateKey, timeZone) : formatLocalDay(timeZone, 'long')

  let zoneSuffix = ''
  if (showZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short',
      }).formatToParts(new Date())
      zoneSuffix = parts.find((p) => p.type === 'timeZoneName')?.value || timeZone
    } catch {
      zoneSuffix = timeZone
    }
  }

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      <span className="font-medium text-foreground">{relative ?? label}</span>
      {relative ? (
        <>
          <span className="mx-1.5 text-border">·</span>
          <span>{label}</span>
        </>
      ) : null}
      {showZone && zoneSuffix ? (
        <>
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">{zoneSuffix}</span>
        </>
      ) : null}
    </p>
  )
}

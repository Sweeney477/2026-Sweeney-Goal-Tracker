'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickLogMetricId } from '@/lib/checkins/quick-log'
import { trackerById } from '@/lib/config/trackers'

export type YesterdayCatchUpBannerProps = {
  preferredMetric: QuickLogMetricId
  incompleteCount: number
  onCatchUp: () => void
  onDismiss: () => void
  className?: string
}

/**
 * Soft, guilt-free prompt to finish yesterday’s leading metrics.
 */
export function YesterdayCatchUpBanner({
  preferredMetric,
  incompleteCount,
  onCatchUp,
  onDismiss,
  className,
}: YesterdayCatchUpBannerProps) {
  const label = trackerById(preferredMetric)?.label ?? preferredMetric
  const detail =
    incompleteCount <= 1
      ? `A quick ${label.toLowerCase()} log keeps your streak steady.`
      : `A few leading metrics from yesterday are still open — start with ${label.toLowerCase()}.`

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] pastel-butter px-4 py-4 shadow-soft',
        'ring-1 ring-border/40',
        className
      )}
      data-testid="yesterday-catchup-banner"
      role="region"
      aria-label="Quick catch-up for yesterday"
    >
      <div className="pr-8">
        <p className="font-display text-base font-semibold tracking-tight text-foreground">
          Finish yesterday?
        </p>
        <p className="mt-1 text-sm text-foreground/60">{detail}</p>
        <button
          type="button"
          onClick={onCatchUp}
          className={cn(
            'mt-3 inline-flex h-10 items-center justify-center rounded-full',
            'bg-brand px-4 text-sm font-semibold text-brand-foreground',
            'transition-transform active:scale-[0.98]'
          )}
          data-testid="yesterday-catchup-cta"
        >
          Quick catch-up
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-foreground/45 transition-colors hover:bg-white/50 hover:text-foreground/70"
        aria-label="Dismiss for today"
        data-testid="yesterday-catchup-dismiss"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export type YesterdayCatchUpLinkProps = {
  onCatchUp: () => void
  className?: string
}

/** Compact re-entry after the banner is dismissed for the local day. */
export function YesterdayCatchUpLink({ onCatchUp, className }: YesterdayCatchUpLinkProps) {
  return (
    <button
      type="button"
      onClick={onCatchUp}
      className={cn(
        'text-sm font-medium text-brand underline-offset-2 hover:underline',
        className
      )}
      data-testid="yesterday-catchup-link"
    >
      Catch up on yesterday
    </button>
  )
}

import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite">
      <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted/80" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 animate-pulse rounded-3xl bg-muted/70" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted/70" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  className?: string
  /** denser placeholder for form-heavy pages */
  variant?: 'page' | 'form' | 'list'
}

export function LoadingState({
  label = 'Loading…',
  className,
  variant = 'page',
}: LoadingStateProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-md bg-muted" />
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full rounded-md bg-muted/80" />
      </div>
      {variant === 'form' ? (
        <div className="soft-card space-y-3 p-5">
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="h-11 animate-pulse rounded-full bg-muted" />
        </div>
      ) : variant === 'list' ? (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-[1.5rem] bg-muted/80" />
          <div className="h-16 animate-pulse rounded-[1.5rem] bg-muted/70" />
          <div className="h-16 animate-pulse rounded-[1.5rem] bg-muted/60" />
        </div>
      ) : (
        <>
          <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted/80" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted/70" />
            <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted/70" />
          </div>
        </>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}

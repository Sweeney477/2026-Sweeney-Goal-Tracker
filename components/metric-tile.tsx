import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type MetricTileProps = {
  href?: string
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  badge?: ReactNode
  progress?: number
  featured?: boolean
  className?: string
  onClick?: () => void
}

const baseClass =
  'relative block overflow-hidden rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

export function MetricTile({
  href,
  label,
  value,
  unit,
  icon,
  badge,
  progress,
  featured,
  className,
  onClick,
}: MetricTileProps) {
  const content = (
    <>
      {icon ? <div className="mb-3">{icon}</div> : null}
      {badge ? <div className="absolute right-4 top-4">{badge}</div> : null}
      <div
        className={cn(
          'text-xs font-semibold',
          featured ? 'text-brand-foreground/90' : 'text-muted-foreground'
        )}
      >
        {label}
      </div>
      <div className="mt-1.5 flex items-end gap-1.5">
        <div
          className={cn(
            'font-display text-xl font-semibold tracking-tight',
            featured && 'text-2xl'
          )}
        >
          {value}
        </div>
        {unit ? (
          <div
            className={cn(
              'pb-0.5 text-xs',
              featured ? 'text-brand-foreground/80' : 'text-muted-foreground'
            )}
          >
            {unit}
          </div>
        ) : null}
      </div>
      {typeof progress === 'number' ? (
        <div
          className={cn(
            'mt-3 h-1 w-full overflow-hidden rounded-full',
            featured ? 'bg-white/20' : 'bg-muted'
          )}
        >
          <div
            className={cn('h-full rounded-full', featured ? 'bg-white' : 'bg-brand')}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </>
  )

  const classes = cn(
    baseClass,
    featured && 'border-transparent bg-brand text-brand-foreground hover:bg-brand-deep',
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}

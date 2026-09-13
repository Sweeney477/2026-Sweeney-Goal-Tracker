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
  'relative block overflow-hidden rounded-3xl border p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

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
      {icon ? <div className="absolute left-4 top-4">{icon}</div> : null}
      {badge ? <div className="absolute right-4 top-4">{badge}</div> : null}
      <div className={cn('text-xs font-semibold', featured ? 'opacity-90' : 'text-muted-foreground', icon && 'mt-12')}>
        {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className={cn('font-display text-2xl font-semibold tracking-tight', featured && 'text-3xl')}>
          {value}
        </div>
        {unit ? <div className={cn('pb-1 text-sm', featured ? 'opacity-90' : 'text-muted-foreground')}>{unit}</div> : null}
      </div>
      {typeof progress === 'number' ? (
        <div className={cn('mt-3 h-1.5 w-full overflow-hidden rounded-full', featured ? 'bg-white/20' : 'bg-muted')}>
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
    featured
      ? 'border-transparent bg-gradient-to-br from-brand to-brand-deep text-brand-foreground'
      : 'bg-background',
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

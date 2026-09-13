import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import type { SoftTone } from '@/components/soft-ui'

type MetricTileProps = {
  href?: string
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  badge?: ReactNode
  progress?: number
  featured?: boolean
  tone?: SoftTone
  className?: string
  onClick?: () => void
}

export function MetricTile({
  href,
  label,
  value,
  unit,
  icon,
  badge,
  progress,
  featured,
  tone = 'white',
  className,
  onClick,
}: MetricTileProps) {
  const onBrand = featured || tone === 'brand'
  const toneClass =
    tone === 'mint'
      ? 'pastel-mint'
      : tone === 'peach'
        ? 'pastel-peach'
        : tone === 'lilac'
          ? 'pastel-lilac'
          : tone === 'butter'
            ? 'pastel-butter'
            : tone === 'sky'
              ? 'pastel-sky'
              : tone === 'rose'
                ? 'pastel-rose'
                : null

  const content = (
    <>
      {icon ? <div className="mb-3">{icon}</div> : null}
      {badge ? <div className="absolute right-4 top-4">{badge}</div> : null}
      <div
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          onBrand ? 'text-brand-foreground/90' : 'text-muted-foreground'
        )}
      >
        {label}
      </div>
      <div className="mt-1.5 flex items-end gap-1.5">
        <div
          className={cn(
            'font-display text-xl font-semibold tracking-tight',
            featured && 'text-2xl',
            onBrand && 'text-brand-foreground'
          )}
        >
          {value}
        </div>
        {unit ? (
          <div
            className={cn(
              'pb-0.5 text-xs',
              onBrand ? 'text-brand-foreground/80' : 'text-muted-foreground'
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
            onBrand ? 'bg-white/20' : 'bg-white/55'
          )}
        >
          <div
            className={cn('h-full rounded-full', onBrand ? 'bg-white' : 'bg-brand')}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </>
  )

  const classes = cn(
    'relative block overflow-hidden rounded-[1.75rem] p-4 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
    onBrand ? 'bg-brand text-brand-foreground' : toneClass || 'soft-card',
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

import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import type { SoftPastel } from '@/lib/config/trackers'

export type SoftTone = 'mint' | 'peach' | 'lilac' | 'butter' | 'sky' | 'rose' | 'brand' | 'white'

const toneClass: Record<SoftTone, string> = {
  mint: 'pastel-mint',
  peach: 'pastel-peach',
  lilac: 'pastel-lilac',
  butter: 'pastel-butter',
  sky: 'pastel-sky',
  rose: 'pastel-rose',
  brand: 'bg-brand text-brand-foreground',
  white: 'bg-card',
}

export function toneFromPastel(accent: SoftPastel): SoftTone {
  switch (accent) {
    case 'pastel-peach':
      return 'peach'
    case 'pastel-lilac':
      return 'lilac'
    case 'pastel-butter':
      return 'butter'
    case 'pastel-sky':
      return 'sky'
    case 'pastel-rose':
      return 'rose'
    case 'pastel-mint':
    default:
      return 'mint'
  }
}

type SoftCardProps = {
  children: ReactNode
  className?: string
  tone?: SoftTone
  href?: string
  onClick?: () => void
  flat?: boolean
}

export function SoftCard({ children, className, tone = 'white', href, onClick, flat }: SoftCardProps) {
  const isPastel = tone !== 'white' && tone !== 'brand'
  const classes = cn(
    flat ? 'soft-card-flat' : isPastel ? 'rounded-[1.75rem] shadow-soft' : 'soft-card',
    toneClass[tone],
    'relative overflow-hidden p-4 transition-transform duration-200',
    (href || onClick) && 'hover:-translate-y-0.5 active:translate-y-0',
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'w-full text-left')}>
        {children}
      </button>
    )
  }
  return <div className={classes}>{children}</div>
}

type ActivityCardProps = {
  href?: string
  onClick?: () => void
  category: string
  title: string
  value: ReactNode
  unit?: string
  icon: ReactNode
  tone?: SoftTone
  done?: boolean
  className?: string
}

/** Pastel routine / metric card — icon, category, title, big measurement, optional check */
export function ActivityCard({
  href,
  onClick,
  category,
  title,
  value,
  unit,
  icon,
  tone = 'mint',
  done,
  className,
}: ActivityCardProps) {
  const onBrand = tone === 'brand'
  return (
    <SoftCard href={href} onClick={onClick} tone={tone} className={cn('min-h-[148px]', className)}>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'grid h-9 w-9 place-items-center rounded-2xl',
            onBrand ? 'bg-white/15 text-brand-foreground' : 'bg-white/70 text-foreground'
          )}
        >
          {icon}
        </div>
        {done ? (
          <span
            className={cn(
              'grid h-6 w-6 place-items-center rounded-full',
              onBrand ? 'bg-white/20 text-brand-foreground' : 'bg-brand/15 text-brand'
            )}
            aria-label="Logged"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'mt-4 text-[11px] font-semibold uppercase tracking-[0.12em]',
          onBrand ? 'text-brand-foreground/75' : 'text-muted-foreground'
        )}
      >
        {category}
      </div>
      <div className={cn('mt-0.5 text-sm font-semibold', onBrand ? 'text-brand-foreground' : 'text-foreground')}>
        {title}
      </div>
      <div className="mt-3 flex items-end gap-1">
        <div
          className={cn(
            'font-display text-2xl font-semibold tracking-tight',
            onBrand ? 'text-brand-foreground' : 'text-foreground'
          )}
        >
          {value}
        </div>
        {unit ? (
          <div
            className={cn(
              'pb-1 text-xs font-medium',
              onBrand ? 'text-brand-foreground/75' : 'text-muted-foreground'
            )}
          >
            {unit}
          </div>
        ) : null}
      </div>
    </SoftCard>
  )
}

type ProgressChipProps = {
  label: string
  value: ReactNode
  hint?: string
  tone?: SoftTone
  href?: string
}

/** Horizontal rail chip for progress / summary scroller */
export function ProgressChip({ label, value, hint, tone = 'white', href }: ProgressChipProps) {
  const onBrand = tone === 'brand'
  return (
    <SoftCard href={href} tone={tone} className="min-w-[152px] shrink-0 snap-start px-4 py-3.5">
      <div
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          onBrand ? 'text-brand-foreground/75' : 'text-muted-foreground'
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'mt-1 font-display text-xl font-semibold tracking-tight',
          onBrand ? 'text-brand-foreground' : 'text-foreground'
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className={cn('mt-0.5 text-xs', onBrand ? 'text-brand-foreground/70' : 'text-muted-foreground')}>
          {hint}
        </div>
      ) : null}
    </SoftCard>
  )
}

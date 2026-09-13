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
  /** Optional secondary line under category — keep short */
  title?: string
  value: ReactNode
  unit?: string
  icon: ReactNode
  tone?: SoftTone
  done?: boolean
  className?: string
}

/**
 * Reference-style pastel activity tile:
 * thin icon · category · large bold measurement · check when done
 */
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
    <SoftCard
      href={href}
      onClick={onClick}
      tone={tone}
      className={cn('flex min-h-[158px] flex-col justify-between p-4 md:min-h-[168px] md:p-5', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'grid h-9 w-9 place-items-center rounded-2xl',
            onBrand ? 'bg-white/15 text-brand-foreground' : 'bg-white/65 text-foreground/80'
          )}
        >
          {icon}
        </div>
        {done ? (
          <span
            className={cn(
              'grid h-7 w-7 place-items-center rounded-full',
              onBrand ? 'bg-white/20 text-brand-foreground' : 'bg-white/80 text-brand'
            )}
            aria-label="Logged"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.14em]',
            onBrand ? 'text-brand-foreground/70' : 'text-foreground/45'
          )}
        >
          {category}
        </div>
        {title ? (
          <div
            className={cn(
              'mt-0.5 text-sm font-medium',
              onBrand ? 'text-brand-foreground/85' : 'text-foreground/70'
            )}
          >
            {title}
          </div>
        ) : null}
        <div className="mt-3 flex items-end gap-1.5">
          <div
            className={cn(
              'font-display text-[1.85rem] font-semibold leading-none tracking-tight md:text-3xl',
              onBrand ? 'text-brand-foreground' : 'text-foreground'
            )}
          >
            {value}
          </div>
          {unit ? (
            <div
              className={cn(
                'pb-0.5 text-sm font-medium',
                onBrand ? 'text-brand-foreground/70' : 'text-foreground/45'
              )}
            >
              {unit}
            </div>
          ) : null}
          {done ? (
            <Check
              className={cn(
                'mb-0.5 ml-0.5 h-4 w-4',
                onBrand ? 'text-brand-foreground/80' : 'text-brand'
              )}
              strokeWidth={2.5}
              aria-hidden
            />
          ) : null}
        </div>
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

/** Horizontal rail chip — keep pastel-filled like reference scroller */
export function ProgressChip({ label, value, hint, tone = 'butter', href }: ProgressChipProps) {
  const onBrand = tone === 'brand'
  return (
    <SoftCard href={href} tone={tone} className="min-w-[148px] shrink-0 snap-start px-4 py-3.5">
      <div
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          onBrand ? 'text-brand-foreground/75' : 'text-foreground/45'
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
        <div className={cn('mt-0.5 text-xs', onBrand ? 'text-brand-foreground/70' : 'text-foreground/50')}>
          {hint}
        </div>
      ) : null}
    </SoftCard>
  )
}

type HeroActionCardProps = {
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode
  ctaLabel: string
  href: string
  className?: string
}

/** Soft white featured card with decorative orb + bottom CTA row */
export function HeroActionCard({
  eyebrow = 'Next up',
  title,
  description,
  meta,
  ctaLabel,
  href,
  className,
}: HeroActionCardProps) {
  return (
    <SoftCard className={cn('p-0', className)}>
      <div className="relative overflow-hidden px-5 pb-4 pt-5 md:px-6 md:pt-6">
        {/* Decorative soft orbs — light, not gamey */}
        <div
          className="pointer-events-none absolute -right-4 top-0 h-36 w-36 rounded-full opacity-90 blur-2xl"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, hsl(265 70% 78% / 0.55), transparent 62%), radial-gradient(circle at 70% 70%, hsl(22 90% 72% / 0.45), transparent 58%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 right-16 h-24 w-24 rounded-full opacity-70 blur-2xl"
          style={{
            background: 'radial-gradient(circle, hsl(173 50% 70% / 0.35), transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative max-w-[78%]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
          <div className="font-display mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
            {title}
          </div>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          {meta ? <div className="mt-3 text-sm text-muted-foreground">{meta}</div> : null}
        </div>
      </div>

      <Link
        href={href}
        className="relative flex items-center justify-between gap-3 border-t border-border/50 px-5 py-3.5 text-sm font-semibold text-brand transition-colors hover:bg-muted/30 md:px-6"
      >
        <span>{ctaLabel}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </SoftCard>
  )
}

'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DailyWinItem } from '@/lib/checkins/domain'
import { SoftCard } from '@/components/soft-ui'

type TodayChecklistProps = {
  items: DailyWinItem[]
  className?: string
}

export function TodayChecklist({ items, className }: TodayChecklistProps) {
  const done = items.filter((item) => item.done).length

  return (
    <SoftCard className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">Today&apos;s checklist</div>
          <div className="text-xs text-muted-foreground">
            {done}/{items.length} leading metrics logged
          </div>
        </div>
        <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          {items.length === 0 ? '—' : Math.round((done / items.length) * 100)}%
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50',
                item.done && 'opacity-90'
              )}
            >
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-xs',
                  item.done
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground ring-1 ring-border/60'
                )}
                aria-hidden
              >
                {item.done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.helper}</span>
              </span>
              <span className="text-xs font-medium text-brand">{item.done ? 'Done' : 'Log'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SoftCard>
  )
}

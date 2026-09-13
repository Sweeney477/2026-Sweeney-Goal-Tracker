'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DailyWinItem } from '@/lib/checkins/domain'

type TodayChecklistProps = {
  items: DailyWinItem[]
  className?: string
}

export function TodayChecklist({ items, className }: TodayChecklistProps) {
  const done = items.filter((item) => item.done).length

  return (
    <section className={cn('rounded-3xl border bg-background p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Minimum viable day</div>
          <div className="text-xs text-muted-foreground">
            {done}/{items.length} leading metrics logged
          </div>
        </div>
        <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          {items.length === 0 ? '—' : Math.round((done / items.length) * 100)}%
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors',
                item.done
                  ? 'border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'bg-muted/20 hover:bg-muted/40'
              )}
            >
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full border text-xs',
                  item.done
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-muted-foreground/30 text-muted-foreground'
                )}
                aria-hidden
              >
                {item.done ? <Check className="h-4 w-4" /> : null}
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
    </section>
  )
}

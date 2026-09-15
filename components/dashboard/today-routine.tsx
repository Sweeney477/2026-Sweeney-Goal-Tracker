'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  CheckSquare,
  Code2,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
} from 'lucide-react'
import { ActivityCard, HeroActionCard, type SoftTone } from '@/components/soft-ui'
import { QuickLogSheet, type QuickLogSuggestions } from '@/components/check-ins/quick-log-sheet'
import {
  isQuickLogMetric,
  type QuickLogMetricId,
  type QuickLogSaveResult,
} from '@/lib/checkins/quick-log'
import type { UnitSystem } from '@/lib/units'
import type { QuickLogTileId } from '@/lib/config/trackers'

export type TodayActivityCard = {
  id: QuickLogTileId
  label: string
  href: string
  tone: SoftTone
  done: boolean
  value: string | number
  unit?: string
  title: string
  /** Raw numeric for sheet prefill (weight / steps / coding minutes). */
  rawValue?: number | null
}

export type TodayRoutineProps = {
  name: string
  timeZone: string
  today: string
  dayLabel: string
  units: UnitSystem
  streak: number
  checklistLength: number
  initialCards: TodayActivityCard[]
  suggestions: QuickLogSuggestions
  /** Optional override for sheet day — reserved for #13 yesterday catch-up. */
  logDate?: string
}

function iconFor(id: QuickLogTileId) {
  const props = { className: 'h-4 w-4', strokeWidth: 1.75 as const }
  switch (id) {
    case 'weight':
      return <Scale {...props} />
    case 'steps':
      return <Footprints {...props} />
    case 'food':
      return <Flame {...props} />
    case 'workout':
      return <Dumbbell {...props} />
    case 'code':
      return <Code2 {...props} />
    default:
      return <CheckSquare {...props} />
  }
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function formatCardAfterSave(
  metric: QuickLogMetricId,
  numericValue: number,
  units: UnitSystem
): { value: string | number; unit?: string; title: string } {
  if (metric === 'weight') {
    return {
      value: numericValue,
      unit: units === 'metric' ? 'kg' : 'lbs',
      title: 'Logged',
    }
  }
  if (metric === 'steps') {
    return {
      value: numericValue.toLocaleString(),
      unit: 'steps',
      title: 'On track',
    }
  }
  return {
    value: (numericValue / 60).toFixed(1),
    unit: 'hr',
    title: 'Deep work',
  }
}

export function TodayRoutine({
  name,
  timeZone,
  today,
  dayLabel,
  units,
  streak,
  checklistLength,
  initialCards,
  suggestions,
  logDate,
}: TodayRoutineProps) {
  const [cards, setCards] = useState(initialCards)
  const [sheetMetric, setSheetMetric] = useState<QuickLogMetricId | null>(null)

  const targetDate = logDate || today
  const doneCount = useMemo(() => cards.filter((c) => c.done).length, [cards])
  const complete = checklistLength > 0 && doneCount === checklistLength
  const nextItem = cards.find((c) => !c.done) || cards[0]

  const openSheet = (metric: QuickLogMetricId) => setSheetMetric(metric)
  const closeSheet = () => setSheetMetric(null)

  const handleSaved = (result: QuickLogSaveResult) => {
    const formatted = formatCardAfterSave(result.metric, result.numericValue, units)
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== result.metric) return card
        return {
          ...card,
          done: true,
          value: formatted.value,
          unit: formatted.unit,
          title: formatted.title,
          rawValue: result.numericValue,
        }
      })
    )
  }

  const activeCard = sheetMetric ? cards.find((c) => c.id === sheetMetric) : null
  const sheetInitial =
    activeCard?.rawValue != null && Number.isFinite(activeCard.rawValue)
      ? String(activeCard.rawValue)
      : undefined

  const heroHref = nextItem?.href || '/check-ins'

  return (
    <>
      <section className="space-y-5">
        <div>
          <h1 className="font-display text-[1.85rem] font-semibold tracking-tight text-foreground md:text-4xl">
            Hello, {name}
          </h1>
          <p className="mt-1 text-base text-muted-foreground md:text-lg">Today&apos;s summary</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                {pad2(doneCount)}
              </span>
              <span className="font-display text-3xl font-medium text-foreground/25 md:text-4xl">/</span>
              <span className="font-display text-3xl font-medium text-foreground/30 md:text-4xl">
                {pad2(checklistLength)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tot activities today</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl bg-card shadow-soft ring-1 ring-border/50"
              title={dayLabel}
            >
              <CalendarDays className="h-5 w-5 text-foreground/70" strokeWidth={1.6} aria-hidden />
              <span className="sr-only">{dayLabel}</span>
            </div>
            {streak > 0 ? (
              <div className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {streak}-day streak
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <HeroActionCard
        eyebrow={complete ? 'Today' : 'Focus'}
        title={
          complete
            ? 'Today looks complete'
            : nextItem
              ? `Log ${nextItem.label.toLowerCase()}`
              : 'Start today’s log'
        }
        description={
          complete
            ? 'All leading metrics are in. Keep the calm streak going tomorrow.'
            : nextItem
              ? `Capture ${nextItem.label.toLowerCase()} for your local day.`
              : 'Capture the next leading metric for your local day.'
        }
        meta={
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              Progress{' '}
              <strong className="font-semibold text-foreground">
                {doneCount}/{checklistLength}
              </strong>
            </span>
            <span className="text-foreground/35">·</span>
            <span>{dayLabel}</span>
          </div>
        }
        ctaLabel={complete ? 'Open today’s log' : 'Start today’s session'}
        href={heroHref || '/check-ins'}
        onCtaClick={
          nextItem && isQuickLogMetric(nextItem.id) && !complete
            ? () => {
                const id = nextItem.id
                if (isQuickLogMetric(id)) openSheet(id)
              }
            : undefined
        }
      />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Today&apos;s routine</h2>
          <Link href="/check-ins" className="text-sm font-medium text-brand">
            Open log
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {cards.map((card) => {
            const cardProps = {
              category: card.label,
              title: card.title,
              value: card.value as ReactNode,
              unit: card.unit,
              icon: iconFor(card.id),
              tone: card.tone,
              done: card.done,
            }
            if (isQuickLogMetric(card.id)) {
              const metric = card.id
              return (
                <ActivityCard
                  key={card.id}
                  {...cardProps}
                  onClick={() => openSheet(metric)}
                />
              )
            }
            return <ActivityCard key={card.id} {...cardProps} href={card.href} />
          })}
        </div>
      </section>

      <QuickLogSheet
        open={sheetMetric != null}
        onClose={closeSheet}
        metric={sheetMetric}
        date={targetDate}
        timeZone={timeZone}
        units={units}
        suggestions={suggestions}
        initialValue={sheetInitial}
        onSaved={handleSaved}
      />
    </>
  )
}

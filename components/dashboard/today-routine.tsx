'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  YesterdayCatchUpBanner,
  YesterdayCatchUpLink,
} from '@/components/dashboard/yesterday-catchup-banner'
import {
  isQuickLogMetric,
  type QuickLogMetricId,
  type QuickLogSaveResult,
} from '@/lib/checkins/quick-log'
import {
  yesterdayCatchUpDismissKey,
  type YesterdayCatchUpInfo,
} from '@/lib/checkins/yesterday-catchup'
import {
  consumeWeekClosedToastPending,
  readClosedWeeklyRitual,
  shouldPromoteSundayReview,
} from '@/lib/review/weekly-ritual'
import { toast } from '@/components/ui/toast'
import type { UnitSystem } from '@/lib/units'
import type { QuickLogTileId } from '@/lib/config/trackers'
import { streakTracker } from '@/lib/config/trackers'

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
  userId: string
  timeZone: string
  today: string
  /** Monday key for the week containing `today`. */
  weekStart: string
  /** Sunday in the user's profile timezone (or visual-review demo). */
  isSunday: boolean
  dayLabel: string
  units: UnitSystem
  streak: number
  checklistLength: number
  initialCards: TodayActivityCard[]
  suggestions: QuickLogSuggestions
  /** When set, yesterday has incomplete sheetable leading metrics. */
  catchUp: YesterdayCatchUpInfo | null
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

function nextCatchUpMetric(
  incomplete: QuickLogMetricId[],
  justSaved?: QuickLogMetricId
): QuickLogMetricId | null {
  const remaining = justSaved ? incomplete.filter((m) => m !== justSaved) : incomplete
  if (!remaining.length) return null
  const streakId = streakTracker()?.id
  if (streakId && isQuickLogMetric(streakId) && remaining.includes(streakId)) {
    return streakId
  }
  return remaining[0]
}

export function TodayRoutine({
  name,
  userId,
  timeZone,
  today,
  weekStart,
  isSunday,
  dayLabel,
  units,
  streak,
  checklistLength,
  initialCards,
  suggestions,
  catchUp: catchUpProp,
}: TodayRoutineProps) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  /** Today’s one-tap sheet — independent from catch-up. */
  const [todayMetric, setTodayMetric] = useState<QuickLogMetricId | null>(null)
  /** Yesterday catch-up sheet — must not share open state with today. */
  const [catchUpMetric, setCatchUpMetric] = useState<QuickLogMetricId | null>(null)
  /** Optimistic completions so router.refresh() can’t flash the banner back. */
  const [caughtUpMetrics, setCaughtUpMetrics] = useState<QuickLogMetricId[]>([])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [dismissHydrated, setDismissHydrated] = useState(false)
  const [weekClosed, setWeekClosed] = useState(false)
  const [weekHydrated, setWeekHydrated] = useState(false)

  useEffect(() => {
    setCaughtUpMetrics([])
  }, [userId, today, catchUpProp?.yesterday])

  useEffect(() => {
    try {
      const key = yesterdayCatchUpDismissKey(userId, today)
      setBannerDismissed(window.localStorage.getItem(key) === '1')
    } catch {
      setBannerDismissed(false)
    }
    setDismissHydrated(true)
  }, [userId, today])

  useEffect(() => {
    setWeekClosed(Boolean(readClosedWeeklyRitual(userId, weekStart)))
    setWeekHydrated(true)
    if (consumeWeekClosedToastPending()) {
      toast('Week closed', 'success')
    }
  }, [userId, weekStart])

  const catchUp = useMemo(() => {
    if (!catchUpProp) return null
    const incompleteMetrics = catchUpProp.incompleteMetrics.filter(
      (m) => !caughtUpMetrics.includes(m)
    )
    if (!incompleteMetrics.length) return null
    const preferredMetric = nextCatchUpMetric(incompleteMetrics)
    if (!preferredMetric) return null
    return {
      ...catchUpProp,
      preferredMetric,
      incompleteMetrics,
    }
  }, [catchUpProp, caughtUpMetrics])

  const doneCount = useMemo(() => cards.filter((c) => c.done).length, [cards])
  const complete = checklistLength > 0 && doneCount === checklistLength
  const nextItem = cards.find((c) => !c.done) || cards[0]

  const openTodaySheet = (metric: QuickLogMetricId) => {
    setCatchUpMetric(null)
    setTodayMetric(metric)
  }
  const closeTodaySheet = () => setTodayMetric(null)

  const openCatchUpSheet = (metric?: QuickLogMetricId) => {
    const target = metric ?? catchUp?.preferredMetric
    if (!target) return
    setTodayMetric(null)
    setCatchUpMetric(target)
  }
  const closeCatchUpSheet = () => setCatchUpMetric(null)

  const handleTodaySaved = (result: QuickLogSaveResult) => {
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
    // Streak SoftCard below is server-rendered; refresh after weight logs.
    if (result.metric === (streakTracker()?.id ?? 'weight')) {
      router.refresh()
    }
  }

  const handleCatchUpSaved = (result: QuickLogSaveResult) => {
    setCaughtUpMetrics((prev) =>
      prev.includes(result.metric) ? prev : [...prev, result.metric]
    )
    // Recalculate streak (and any server surfaces) after yesterday write.
    router.refresh()
  }

  const dismissBanner = () => {
    setBannerDismissed(true)
    try {
      window.localStorage.setItem(yesterdayCatchUpDismissKey(userId, today), '1')
    } catch {
      /* ignore quota / private mode */
    }
  }

  const activeTodayCard = todayMetric ? cards.find((c) => c.id === todayMetric) : null
  const todaySheetInitial =
    activeTodayCard?.rawValue != null && Number.isFinite(activeTodayCard.rawValue)
      ? String(activeTodayCard.rawValue)
      : undefined

  const heroHref = nextItem?.href || '/check-ins'
  const showCatchUp = Boolean(catchUp && catchUp.incompleteMetrics.length > 0)
  const showBanner = showCatchUp && dismissHydrated && !bannerDismissed
  const showCatchUpLink = showCatchUp && dismissHydrated && bannerDismissed
  const promoteSundayReview =
    weekHydrated && shouldPromoteSundayReview({ isSunday, weekAlreadyClosed: weekClosed })
  const sundayWeekClosed = weekHydrated && isSunday && weekClosed

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

      {showBanner && catchUp ? (
        <YesterdayCatchUpBanner
          preferredMetric={catchUp.preferredMetric}
          incompleteCount={catchUp.incompleteMetrics.length}
          onCatchUp={() => openCatchUpSheet()}
          onDismiss={dismissBanner}
        />
      ) : null}

      {showCatchUpLink ? (
        <div className="flex justify-end">
          <YesterdayCatchUpLink onCatchUp={() => openCatchUpSheet()} />
        </div>
      ) : null}

      {promoteSundayReview ? (
        <HeroActionCard
          eyebrow="Sunday"
          title="Close the week"
          description="A short, calm review — what went well, what to adjust, then you’re done."
          meta={
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>{dayLabel}</span>
              <span className="text-foreground/35">·</span>
              <span>Weekly review</span>
            </div>
          }
          ctaLabel="Start weekly review"
          href="/review"
          data-testid="sunday-review-hero"
        />
      ) : sundayWeekClosed ? (
        <HeroActionCard
          eyebrow="This week"
          title="Week closed"
          description="Nice close. Keep today’s log gentle — the week is already reflected."
          meta={
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>{dayLabel}</span>
              <span className="text-foreground/35">·</span>
              <span>
                Progress{' '}
                <strong className="font-semibold text-foreground">
                  {doneCount}/{checklistLength}
                </strong>
              </span>
            </div>
          }
          ctaLabel={complete ? 'Open today’s log' : nextItem ? `Log ${nextItem.label.toLowerCase()}` : 'Open today’s log'}
          href={heroHref || '/check-ins'}
          onCtaClick={
            nextItem && isQuickLogMetric(nextItem.id) && !complete
              ? () => {
                  const id = nextItem.id
                  if (isQuickLogMetric(id)) openTodaySheet(id)
                }
              : undefined
          }
          data-testid="sunday-week-closed-hero"
        />
      ) : (
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
                  if (isQuickLogMetric(id)) openTodaySheet(id)
                }
              : undefined
          }
        />
      )}

      <div className="flex justify-end">
        <Link
          href="/review"
          className="text-sm font-medium text-brand underline-offset-2 hover:underline"
          data-testid="today-weekly-review-link"
        >
          Weekly review
        </Link>
      </div>

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
                  onClick={() => openTodaySheet(metric)}
                  data-testid={`today-tile-${metric}`}
                />
              )
            }
            return (
              <ActivityCard
                key={card.id}
                {...cardProps}
                href={card.href}
                data-testid={`today-tile-${card.id}`}
              />
            )
          })}
        </div>
      </section>

      <QuickLogSheet
        open={todayMetric != null}
        onClose={closeTodaySheet}
        metric={todayMetric}
        date={today}
        timeZone={timeZone}
        units={units}
        suggestions={suggestions}
        initialValue={todaySheetInitial}
        onSaved={handleTodaySaved}
      />

      <QuickLogSheet
        open={catchUpMetric != null && catchUp != null}
        onClose={closeCatchUpSheet}
        metric={catchUpMetric}
        date={catchUp?.yesterday ?? today}
        timeZone={timeZone}
        units={units}
        suggestions={suggestions}
        onSaved={handleCatchUpSaved}
      />
    </>
  )
}

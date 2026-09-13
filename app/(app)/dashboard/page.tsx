import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CalendarDays,
  CheckSquare,
  Code2,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
  TrendingUp,
} from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { SoftCard, ActivityCard, HeroActionCard, toneFromPastel } from '@/components/soft-ui'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import { buildDailyWinChecklist } from '@/lib/checkins/domain'
import { computeGoalProgress } from '@/lib/goals/progress'
import { latestByTrackerFromCheckins } from '@/lib/goals/latest-readings'
import { dashboardTrackers, streakTracker } from '@/lib/config/trackers'
import { normalizeUnits, percentOfGoal, weightUnitLabel } from '@/lib/units'
import { formatLocalDay, localDayKey, resolveTimezone } from '@/lib/dates'

function firstName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const meta = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string
  if (meta.trim()) return meta.trim().split(/\s+/)[0]
  const local = (user.email || '').split('@')[0]
  const part = local.split(/[.\-_]/).filter(Boolean)[0]
  return part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : 'there'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('step_goal, coding_goal_minutes, calorie_goal, units, timezone')
    .eq('user_id', user.id)
    .maybeSingle()

  const timeZone = resolveTimezone(profile?.timezone)
  const today = localDayKey(timeZone)
  const streakDef = streakTracker()
  const streakType = streakDef?.checkinType ?? 'weight'
  const name = firstName(user)

  const thirtyDaysAgo = (() => {
    const d = new Date(`${today}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 30)
    return localDayKey(timeZone, d)
  })()

  const [
    { data: todayCheckins },
    { data: streakCheckins },
    { data: latestWeight },
    { data: weightData },
    { data: recentCheckins },
    { data: goals },
  ] = await Promise.all([
    supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', today),
    supabase
      .from('checkins')
      .select('date')
      .eq('user_id', user.id)
      .eq('type', streakType)
      .order('date', { ascending: false })
      .limit(60),
    supabase
      .from('checkins')
      .select('value_json')
      .eq('user_id', user.id)
      .eq('type', 'weight')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('checkins')
      .select('date, value_json')
      .eq('user_id', user.id)
      .eq('type', 'weight')
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),
    supabase
      .from('checkins')
      .select('type, value_json, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(40),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const units = normalizeUnits(profile?.units)
  const stepGoal = profile?.step_goal || 10000
  const codingGoal = profile?.coding_goal_minutes || 240
  const calorieGoal = profile?.calorie_goal || 2200

  const streak = calculateDailyStreak(
    (streakCheckins || []).map((c) => c.date),
    today
  )
  const checklist = buildDailyWinChecklist(todayCheckins || [], today)
  const doneCount = checklist.filter((i) => i.done).length
  const nextItem = checklist.find((i) => !i.done) || checklist[0]

  const chartData =
    weightData?.map((item) => ({
      date: item.date,
      value: Number(item.value_json?.value) || 0,
    })) || []

  const valueFor = (type: string) =>
    todayCheckins?.find((c) => c.type === type)?.value_json?.value
  const latestWeightValue = latestWeight?.value_json?.value
  const stepsToday = valueFor('steps')
  const caloriesToday = valueFor('calories')
  const codingToday = valueFor('coding_minutes')
  const workoutToday = todayCheckins?.find((c) => c.type === 'workout')

  const latestByTracker = {
    ...latestByTrackerFromCheckins(recentCheckins),
    weight:
      latestWeightValue != null
        ? Number(latestWeightValue)
        : latestByTrackerFromCheckins(recentCheckins).weight ?? null,
  }

  const iconFor = (id: string) => {
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

  const activityCards = dashboardTrackers().map((tracker) => {
    const tone = toneFromPastel(tracker.accent)
    const href = `/check-ins?type=${tracker.queryAliases[0]}`
    const done = checklist.find((c) => c.id === tracker.id)?.done

    if (tracker.id === 'weight') {
      return {
        tracker,
        href,
        tone,
        done,
        value: latestWeightValue ?? '—',
        unit: weightUnitLabel(units),
        title: done ? 'Logged' : 'Log weight',
      }
    }
    if (tracker.id === 'steps') {
      const value = stepsToday != null ? Number(stepsToday) : null
      return {
        tracker,
        href,
        tone,
        done,
        value: value != null ? value.toLocaleString() : '—',
        unit: 'steps',
        title: done ? 'On track' : 'Log steps',
      }
    }
    if (tracker.id === 'food') {
      return {
        tracker,
        href,
        tone,
        done,
        value: caloriesToday ?? '—',
        unit: 'cal',
        title: done ? 'Meals logged' : 'Log food',
      }
    }
    if (tracker.id === 'workout') {
      return {
        tracker,
        href,
        tone,
        done,
        value: workoutToday?.value_json?.type || (workoutToday ? 'Done' : '—'),
        unit: undefined as string | undefined,
        title: done ? 'Session done' : 'Log workout',
      }
    }
    const value = codingToday != null ? Number(codingToday) : null
    return {
      tracker,
      href,
      tone,
      done,
      value: value != null ? (value / 60).toFixed(1) : '—',
      unit: value != null ? 'hr' : undefined,
      title: done ? 'Deep work' : 'Log coding',
    }
  })

  const activeGoals = (goals || []).map((goal) => ({
    ...goal,
    progress: computeGoalProgress(goal, latestByTracker),
  }))

  const goalPastels = ['pastel-mint', 'pastel-lilac', 'pastel-sky'] as const


  const complete = checklist.length > 0 && doneCount === checklist.length
  const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0')

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hello + Today’s summary + big activity count */}
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
                {pad2(checklist.length)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tot activities today</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl bg-card shadow-soft ring-1 ring-border/50"
              title={formatLocalDay(timeZone, 'long')}
            >
              <CalendarDays className="h-5 w-5 text-foreground/70" strokeWidth={1.6} aria-hidden />
              <span className="sr-only">{formatLocalDay(timeZone, 'long')}</span>
            </div>
            {streak > 0 ? (
              <div className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {streak}-day streak
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Soft white featured hero + orb + CTA */}
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
            : nextItem?.helper || 'Capture the next leading metric for your local day.'
        }
        meta={
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              Progress{' '}
              <strong className="font-semibold text-foreground">
                {doneCount}/{checklist.length}
              </strong>
            </span>
            <span className="text-foreground/35">·</span>
            <span>{formatLocalDay(timeZone, 'long')}</span>
          </div>
        }
        ctaLabel={complete ? 'Open today’s log' : 'Start today’s session'}
        href={nextItem?.href || '/check-ins'}
      />

      {/* 2-column pastel activity grid — dominant surface */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Today&apos;s routine</h2>
          <Link href="/check-ins" className="text-sm font-medium text-brand">
            Open log
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {activityCards.map((card) => (
            <ActivityCard
              key={card.tracker.id}
              href={card.href}
              category={card.tracker.label}
              title={card.title}
              value={card.value}
              unit={card.unit}
              icon={iconFor(card.tracker.id)}
              tone={card.tone}
              done={!!card.done}
            />
          ))}
        </div>
      </section>

      {/* Secondary soft surfaces */}
      <section className="grid gap-3 md:grid-cols-5 md:gap-4">
        <SoftCard tone="peach" className="p-5 md:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
            {streakDef ? `${streakDef.label} streak` : 'Logging streak'}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="font-display text-5xl font-semibold tracking-tight">{streak}</div>
            <div className="text-sm font-medium text-foreground/45">days</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Local days · {timeZone}</span>
          </div>
        </SoftCard>

        <SoftCard className="p-5 md:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Weight trend</div>
              <div className="text-xs text-muted-foreground">
                Last 30 days · {weightUnitLabel(units)}
              </div>
            </div>
            <Link href="/check-ins?type=weight" className="text-sm font-medium text-brand">
              Log
            </Link>
          </div>
          <div className="mt-3">
            <WeightChart data={chartData} unit={weightUnitLabel(units)} />
          </div>
        </SoftCard>
      </section>

      {/* Goals as pastel tiles */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Active goals</h2>
          <Link href="/goals" className="text-sm font-medium text-brand">
            View all
          </Link>
        </div>

        {activeGoals.length === 0 ? (
          <SoftCard tone="butter" className="px-5 py-8 text-center">
            <div className="font-display text-base font-semibold">No active goals</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a goal to track outcomes alongside daily logs.
            </p>
            <Link
              href="/goals/new"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground"
            >
              Create goal
            </Link>
          </SoftCard>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.slice(0, 3).map((goal, idx) => (
              <div
                key={goal.id}
                className={`rounded-[1.75rem] p-4 shadow-soft ${goalPastels[idx % goalPastels.length]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{goal.title}</div>
                    <div className="mt-0.5 text-xs text-foreground/50">{goal.progress.outcomeLabel}</div>
                  </div>
                  {goal.progress.outcomePercent != null ? (
                    <div className="font-display text-lg font-semibold text-brand">
                      {goal.progress.outcomePercent}%
                    </div>
                  ) : null}
                </div>
                {goal.progress.outcomePercent != null ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/55">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${goal.progress.outcomePercent}%` }}
                    />
                  </div>
                ) : goal.progress.timeElapsedPercent != null ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/55">
                    <div
                      className="h-full rounded-full bg-foreground/25"
                      style={{ width: `${goal.progress.timeElapsedPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

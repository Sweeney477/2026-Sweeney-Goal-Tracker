import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight,
  CheckSquare,
  Code2,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
  TrendingUp,
} from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { SoftCard, ActivityCard, ProgressChip, toneFromPastel } from '@/components/soft-ui'
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

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{formatLocalDay(timeZone, 'long')}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Hello, {name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Today&apos;s summary</p>
        </div>
        <div className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
          {doneCount}/{checklist.length} logged
        </div>
      </div>

      <SoftCard tone="brand" className="relative overflow-hidden p-5 md:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-foreground/75">
            Next up
          </div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-foreground md:text-3xl">
            {doneCount === checklist.length
              ? 'Today looks complete'
              : nextItem
                ? `Log ${nextItem.label.toLowerCase()}`
                : 'Start today’s log'}
          </div>
          <p className="mt-2 max-w-md text-sm text-brand-foreground/80">
            {doneCount === checklist.length
              ? 'All leading metrics are in. Review goals or keep the streak going tomorrow.'
              : nextItem?.helper || 'Capture the next leading metric for your local day.'}
          </p>
          <Link
            href={nextItem?.href || '/check-ins'}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-brand shadow-soft"
          >
            {doneCount === checklist.length ? 'Open log' : 'Continue'}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </SoftCard>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Your progress</h2>
          <span className="text-xs text-muted-foreground">
            {doneCount} of {checklist.length} today
          </span>
        </div>
        <div className="hide-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          <ProgressChip
            label="Logged"
            value={`${doneCount}/${checklist.length}`}
            hint="Leading metrics"
            tone="mint"
          />
          <ProgressChip
            label="Steps"
            value={stepsToday != null ? Number(stepsToday).toLocaleString() : '—'}
            hint={
              stepsToday != null
                ? `${percentOfGoal(Number(stepsToday), stepGoal)}% of goal`
                : 'No log yet'
            }
            tone="butter"
            href="/check-ins?type=steps"
          />
          <ProgressChip
            label="Calories"
            value={caloriesToday ?? '—'}
            hint={caloriesToday != null ? `Goal ${calorieGoal}` : 'No meals yet'}
            tone="peach"
            href="/check-ins?type=food"
          />
          <ProgressChip
            label="Coding"
            value={codingToday != null ? `${(Number(codingToday) / 60).toFixed(1)}h` : '—'}
            hint={
              codingToday != null
                ? `${percentOfGoal(Number(codingToday), codingGoal)}% of goal`
                : 'No log yet'
            }
            tone="sky"
            href="/check-ins?type=coding_minutes"
          />
          <ProgressChip
            label="Streak"
            value={`${streak}d`}
            hint={streakDef ? `${streakDef.label} consecutive` : 'Local days'}
            tone="lilac"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Today&apos;s routine</h2>
          <Link href="/check-ins" className="text-sm font-medium text-brand">
            Open log
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <SoftCard className="p-5 lg:col-span-3">
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

        <SoftCard tone="peach" className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold">
            {streakDef ? `${streakDef.label} streak` : 'Logging streak'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Consecutive local days</div>
          <div className="mt-6 flex items-baseline gap-2">
            <div className="font-display text-5xl font-semibold tracking-tight">{streak}</div>
            <div className="text-sm font-medium text-muted-foreground">days</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{timeZone}</span>
          </div>
        </SoftCard>
      </div>

      <SoftCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">Active goals</div>
            <div className="text-xs text-muted-foreground">
              Outcome progress when a target is linked
            </div>
          </div>
          <Link href="/goals" className="text-sm font-medium text-brand">
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {activeGoals.length === 0 ? (
            <div className="rounded-[1.5rem] bg-muted/50 px-5 py-8 text-center">
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
            </div>
          ) : (
            activeGoals.slice(0, 3).map((goal, idx) => (
              <div key={goal.id} className={`rounded-[1.35rem] p-4 ${goalPastels[idx % goalPastels.length]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">{goal.progress.outcomeLabel}</div>
                  </div>
                  <div className="text-right text-xs font-semibold">
                    {goal.progress.outcomePercent != null ? (
                      <div className="text-brand">{goal.progress.outcomePercent}%</div>
                    ) : null}
                    {goal.progress.timeElapsedPercent != null ? (
                      <div className="font-normal text-muted-foreground">
                        {goal.progress.timeElapsedPercent}% time
                      </div>
                    ) : null}
                  </div>
                </div>
                {goal.progress.outcomePercent != null ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${goal.progress.outcomePercent}%` }}
                    />
                  </div>
                ) : goal.progress.timeElapsedPercent != null ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full bg-muted-foreground/40"
                      style={{ width: `${goal.progress.timeElapsedPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </SoftCard>
    </div>
  )
}

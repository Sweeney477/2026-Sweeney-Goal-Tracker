import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CheckSquare,
  Code2,
  Dumbbell,
  Flame,
  Footprints,
  TrendingUp,
} from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { EmptyState } from '@/components/empty-state'
import { MetricTile } from '@/components/metric-tile'
import { PageHeader } from '@/components/page-header'
import { DayContext } from '@/components/day-context'
import { TodayChecklist } from '@/components/today-checklist'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import { buildDailyWinChecklist } from '@/lib/checkins/domain'
import { computeGoalProgress } from '@/lib/goals/progress'
import { latestByTrackerFromCheckins } from '@/lib/goals/latest-readings'
import { dashboardTrackers, streakTracker } from '@/lib/config/trackers'
import { normalizeUnits, percentOfGoal, weightUnitLabel } from '@/lib/units'
import { formatLocalDay, localDayKey, resolveTimezone } from '@/lib/dates'

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

  const chartData =
    weightData?.map((item) => ({
      date: item.date,
      value: Number(item.value_json?.value) || 0,
    })) || []

  const valueFor = (type: string) =>
    todayCheckins?.find((c) => c.type === type)?.value_json?.value
  const latestWeightValue = latestWeight?.value_json?.value
  const stepsTodayValue = valueFor('steps')
  const caloriesTodayValue = valueFor('calories')
  const codingTodayValue = valueFor('coding_minutes')
  const workoutToday = todayCheckins?.find((c) => c.type === 'workout')

  const latestByTracker = {
    ...latestByTrackerFromCheckins(recentCheckins),
    weight:
      latestWeightValue != null
        ? Number(latestWeightValue)
        : latestByTrackerFromCheckins(recentCheckins).weight ?? null,
  }

  const dashboardTiles = dashboardTrackers().map((tracker) => {
    if (tracker.id === 'weight') {
      return {
        tracker,
        href: `/check-ins?type=${tracker.queryAliases[0]}`,
        value: latestWeightValue ?? '—',
        unit: weightUnitLabel(units),
        progress: undefined as number | undefined,
        featured: false,
        icon: <CheckSquare className="h-4 w-4 text-brand" />,
      }
    }
    if (tracker.id === 'steps') {
      const value = stepsTodayValue != null ? Number(stepsTodayValue) : null
      return {
        tracker,
        href: `/check-ins?type=${tracker.queryAliases[0]}`,
        value: value != null ? value.toLocaleString() : '—',
        unit: undefined as string | undefined,
        progress: value != null ? percentOfGoal(value, stepGoal) : 0,
        featured: false,
        icon: <Footprints className="h-4 w-4 text-brand" />,
      }
    }
    if (tracker.id === 'food') {
      return {
        tracker,
        href: `/check-ins?type=food`,
        value: caloriesTodayValue ?? '—',
        unit: 'cal',
        progress:
          caloriesTodayValue != null
            ? percentOfGoal(Number(caloriesTodayValue), calorieGoal)
            : undefined,
        featured: false,
        icon: <Flame className="h-4 w-4 text-brand" />,
      }
    }
    if (tracker.id === 'workout') {
      return {
        tracker,
        href: `/check-ins?type=workout`,
        value: workoutToday?.value_json?.type || (workoutToday ? 'Logged' : '—'),
        unit: undefined as string | undefined,
        progress: undefined as number | undefined,
        featured: false,
        icon: <Dumbbell className="h-4 w-4 text-brand" />,
      }
    }
    const value = codingTodayValue != null ? Number(codingTodayValue) : null
    return {
      tracker,
      href: `/check-ins?type=coding_minutes`,
      value: value != null ? `${(value / 60).toFixed(1)}` : '—',
      unit: value != null ? 'hr' : undefined,
      progress: value != null ? percentOfGoal(value, codingGoal) : 0,
      featured: false,
      icon: <Code2 className="h-4 w-4 text-brand" />,
    }
  })

  const doneCount = checklist.filter((item) => item.done).length
  const activeGoals = (goals || []).map((goal) => ({
    ...goal,
    progress: computeGoalProgress(goal, latestByTracker),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today"
        title={formatLocalDay(timeZone, 'long')}
        description="Log leading metrics for the day."
        action={
          <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {doneCount}/{checklist.length} logged
          </div>
        }
      />
      <DayContext timeZone={timeZone} showZone className="-mt-4" />

      <TodayChecklist items={checklist} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {dashboardTiles.map((tile) => (
          <MetricTile
            key={tile.tracker.id}
            href={tile.href}
            label={tile.tracker.label}
            value={tile.value}
            unit={tile.unit}
            progress={tile.progress}
            featured={tile.featured}
            icon={
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">{tile.icon}</div>
            }
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-4 lg:col-span-3">
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
        </div>

        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="text-sm font-semibold">
            {streakDef ? `${streakDef.label} streak` : 'Logging streak'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Consecutive local days with a log
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <div className="font-display text-4xl font-semibold tracking-tight">{streak}</div>
            <div className="text-sm font-medium text-muted-foreground">days</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Based on your timezone ({timeZone}).</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Active goals</div>
            <div className="text-xs text-muted-foreground">Outcome progress when a target is linked</div>
          </div>
          <Link href="/goals" className="text-sm font-medium text-brand">
            View all
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {activeGoals.length === 0 ? (
            <EmptyState
              title="No active goals"
              description="Add a goal to track outcomes alongside daily logs."
              action={
                <Link
                  href="/goals/new"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand-deep"
                >
                  Create goal
                </Link>
              }
            />
          ) : (
            activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="rounded-xl bg-muted/40 p-3">
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
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${goal.progress.outcomePercent}%` }}
                    />
                  </div>
                ) : goal.progress.timeElapsedPercent != null ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
      </div>
    </div>
  )
}

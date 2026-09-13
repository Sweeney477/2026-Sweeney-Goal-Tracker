import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { CheckSquare, Code2, Flame, Footprints, TrendingUp } from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { EmptyState } from '@/components/empty-state'
import { MetricTile } from '@/components/metric-tile'
import { PageHeader } from '@/components/page-header'
import { TodayChecklist } from '@/components/today-checklist'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import { buildDailyWinChecklist } from '@/lib/checkins/domain'
import { computeGoalProgress } from '@/lib/goals/progress'
import { latestByTrackerFromCheckins } from '@/lib/goals/latest-readings'
import {
  dashboardTrackers,
  streakTracker,
} from '@/lib/config/trackers'
import { normalizeUnits, percentOfGoal, weightUnitLabel } from '@/lib/units'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const today = format(new Date(), 'yyyy-MM-dd')
  const streakDef = streakTracker()
  const streakType = streakDef?.checkinType ?? 'weight'

  const [
    { data: todayCheckins },
    { data: streakCheckins },
    { data: latestWeight },
    { data: weightData },
    { data: recentCheckins },
    { data: goals },
    { data: profile },
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
      .gte('date', format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
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
    supabase
      .from('profiles')
      .select('step_goal, coding_goal_minutes, calorie_goal, units')
      .eq('user_id', user.id)
      .maybeSingle(),
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
        featured: true,
        icon: <CheckSquare className="h-5 w-5" />,
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
        icon: <Footprints className="h-5 w-5 text-brand" />,
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
        icon: <Flame className="h-5 w-5 text-orange-600" />,
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
      icon: <Code2 className="h-5 w-5 text-cyan-700" />,
    }
  })

  const doneCount = checklist.filter((item) => item.done).length
  const activeGoals = (goals || []).map((goal) => ({
    ...goal,
    progress: computeGoalProgress(goal, latestByTracker),
  }))

  return (
    <div className="animate-fade-up space-y-4">
      <PageHeader
        eyebrow="Today"
        title={format(new Date(), 'EEEE, MMM d')}
        description="Log the day. Keep the streak."
        action={
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {doneCount}/{checklist.length} done
          </div>
        }
      />

      <TodayChecklist items={checklist} />

      <div className="grid grid-cols-2 gap-3">
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
              <div
                className={
                  tile.featured
                    ? 'grid h-10 w-10 place-items-center rounded-2xl bg-white/15'
                    : 'grid h-10 w-10 place-items-center rounded-2xl bg-brand/10'
                }
              >
                {tile.icon}
              </div>
            }
            badge={
              tile.tracker.id === 'code' ? (
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                    codingTodayValue != null && Number(codingTodayValue) > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  aria-label={
                    codingTodayValue != null && Number(codingTodayValue) > 0
                      ? 'Coding logged today'
                      : 'Coding not logged yet'
                  }
                >
                  {codingTodayValue != null && Number(codingTodayValue) > 0 ? '✓' : ''}
                </div>
              ) : tile.tracker.id === 'steps' && stepsTodayValue != null ? (
                <div className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">
                  {percentOfGoal(Number(stepsTodayValue), stepGoal)}%
                </div>
              ) : null
            }
          />
        ))}
      </div>

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
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

      <div className="relative overflow-hidden rounded-3xl border bg-orange-50 p-5 shadow-sm dark:bg-orange-950/30">
        <div className="text-sm font-semibold">Current streak</div>
        <div className="text-xs text-muted-foreground">
          {streakDef
            ? `Consecutive days with ${streakDef.label.toLowerCase()} logged`
            : 'Daily logging streak'}
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div className="font-display text-5xl font-semibold text-orange-600">{streak}</div>
          <div className="pb-2 text-sm font-semibold">DAYS</div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Consistency compounds.</span>
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Active goals</div>
            <div className="text-xs text-muted-foreground">
              Outcome progress when linked; calendar time shown separately
            </div>
          </div>
          <Link href="/goals" className="text-sm font-medium text-brand">
            View
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {activeGoals.length === 0 ? (
            <EmptyState
              title="No active goals yet"
              description="Create a goal and optional AI tracking plan to stay oriented."
              action={
                <Link href="/goals/new" className="text-sm font-semibold text-brand">
                  Add a goal
                </Link>
              }
            />
          ) : (
            activeGoals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="rounded-2xl border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">{goal.progress.outcomeLabel}</div>
                  </div>
                  <div className="text-right text-xs font-semibold">
                    {goal.progress.outcomePercent != null ? (
                      <div className="text-brand">{goal.progress.outcomePercent}% outcome</div>
                    ) : null}
                    {goal.progress.timeElapsedPercent != null ? (
                      <div className="font-normal text-muted-foreground">
                        {goal.progress.timeElapsedPercent}% time
                      </div>
                    ) : null}
                  </div>
                </div>
                {goal.progress.outcomePercent != null ? (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${goal.progress.outcomePercent}%` }}
                    />
                  </div>
                ) : goal.progress.timeElapsedPercent != null ? (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
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

        <Link
          href="/goals/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed bg-background px-4 py-3 text-sm font-semibold text-muted-foreground"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted">+</span>
          Add new goal
        </Link>
      </div>
    </div>
  )
}

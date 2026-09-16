import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { SoftCard } from '@/components/soft-ui'
import { TodayRoutine, type TodayActivityCard } from '@/components/dashboard/today-routine'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import { buildDailyWinChecklist } from '@/lib/checkins/domain'
import {
  resolveYesterdayCatchUp,
  yesterdayDayKey,
} from '@/lib/checkins/yesterday-catchup'
import { computeGoalProgress } from '@/lib/goals/progress'
import { latestByTrackerFromCheckins } from '@/lib/goals/latest-readings'
import { dashboardTrackers, streakTracker } from '@/lib/config/trackers'
import { toneFromPastel } from '@/components/soft-ui'
import { normalizeUnits, weightUnitLabel } from '@/lib/units'
import { formatLocalDay, localDayKey, resolveTimezone } from '@/lib/dates'
import {
  isLocalSunday,
  ritualWeekStart,
} from '@/lib/review/weekly-ritual'
import { isVisualReview } from '@/lib/supabase/visual-mock'

function firstName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const meta = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string
  if (meta.trim()) return meta.trim().split(/\s+/)[0]
  const local = (user.email || '').split('@')[0]
  const part = local.split(/[.\-_]/).filter(Boolean)[0]
  return part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : 'there'
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { demo?: string }
}) {
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
  const weekStart = ritualWeekStart(today, timeZone)
  const yesterday = yesterdayDayKey(timeZone, today)
  /** Visual-review only: `?demo=sunday` forces the Sunday Review hero for screenshots. */
  const isSunday =
    isLocalSunday(timeZone) ||
    (isVisualReview() && searchParams?.demo === 'sunday')
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
    { data: yesterdayCheckins },
    { data: streakCheckins },
    { data: latestWeight },
    { data: weightData },
    { data: recentCheckins },
    { data: goals },
    { data: projectData },
  ] = await Promise.all([
    supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', today),
    supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', yesterday),
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
    supabase
      .from('projects')
      .select('name, status, week_start')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(5),
  ])

  const units = normalizeUnits(profile?.units)

  const streak = calculateDailyStreak(
    (streakCheckins || []).map((c) => c.date),
    today
  )
  const checklist = buildDailyWinChecklist(todayCheckins || [], today)
  const catchUp = resolveYesterdayCatchUp(yesterdayCheckins || [], yesterday, {
    priorStreakDates: (streakCheckins || []).map((c) => c.date),
  })

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

  const latestSteps =
    stepsToday != null
      ? Number(stepsToday)
      : recentCheckins?.find((c) => c.type === 'steps')?.value_json?.value
  const latestCoding =
    codingToday != null
      ? Number(codingToday)
      : recentCheckins?.find((c) => c.type === 'coding_minutes')?.value_json?.value
  const activeProject =
    (projectData || []).find((p) => p.status === 'in_progress') || (projectData || [])[0] || null

  const activityCards: TodayActivityCard[] = dashboardTrackers().map((tracker) => {
    const tone = toneFromPastel(tracker.accent)
    const href = `/check-ins?type=${tracker.queryAliases[0]}`
    const done = checklist.find((c) => c.id === tracker.id)?.done ?? false

    if (tracker.id === 'weight') {
      const raw =
        latestWeightValue != null && latestWeightValue !== ''
          ? Number(latestWeightValue)
          : null
      return {
        id: tracker.id,
        label: tracker.label,
        href,
        tone,
        done,
        value: latestWeightValue ?? '—',
        unit: weightUnitLabel(units),
        title: done ? 'Logged' : 'Log weight',
        rawValue: Number.isFinite(raw) ? raw : null,
      }
    }
    if (tracker.id === 'steps') {
      const value = stepsToday != null ? Number(stepsToday) : null
      return {
        id: tracker.id,
        label: tracker.label,
        href,
        tone,
        done,
        value: value != null ? value.toLocaleString() : '—',
        unit: 'steps',
        title: done ? 'On track' : 'Log steps',
        rawValue: value,
      }
    }
    if (tracker.id === 'food') {
      return {
        id: tracker.id,
        label: tracker.label,
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
        id: tracker.id,
        label: tracker.label,
        href,
        tone,
        done,
        value: workoutToday?.value_json?.type || (workoutToday ? 'Done' : '—'),
        unit: undefined,
        title: done ? 'Session done' : 'Log workout',
      }
    }
    const value = codingToday != null ? Number(codingToday) : null
    return {
      id: tracker.id,
      label: tracker.label,
      href,
      tone,
      done,
      value: value != null ? (value / 60).toFixed(1) : '—',
      unit: value != null ? 'hr' : undefined,
      title: done ? 'Deep work' : 'Log coding',
      rawValue: value,
    }
  })

  const activeGoals = (goals || []).map((goal) => ({
    ...goal,
    progress: computeGoalProgress(goal, latestByTracker),
  }))

  const goalPastels = ['pastel-mint', 'pastel-lilac', 'pastel-sky'] as const

  const suggestions = {
    weight: latestWeightValue != null ? String(latestWeightValue) : '',
    steps: latestSteps != null ? String(latestSteps) : '',
    codingMinutes: latestCoding != null ? String(latestCoding) : '',
    project: activeProject?.name || '',
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <TodayRoutine
        name={name}
        userId={user.id}
        timeZone={timeZone}
        today={today}
        weekStart={weekStart}
        isSunday={isSunday}
        dayLabel={formatLocalDay(timeZone, 'long')}
        units={units}
        streak={streak}
        checklistLength={checklist.length}
        initialCards={activityCards}
        suggestions={suggestions}
        catchUp={catchUp}
      />

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

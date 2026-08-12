import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronRight, Footprints, Flame, Code2, Bell } from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'
import { WorkoutTodayCard } from '@/components/workout-today'
import {
  computeWorkoutConsistencyStreak,
  workoutAnswerFromValue,
  workoutsYesThisWeek,
} from '@/lib/workout-day'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const [{ data: todayCheckins }, { data: workoutCheckins }, { data: latestWeight }, { data: weightData }, { data: goals }, { data: profile }] =
    await Promise.all([
      supabase.from('checkins').select('*').eq('user_id', user.id).eq('date', today),
      supabase
        .from('checkins')
        .select('date, value_json')
        .eq('user_id', user.id)
        .eq('type', 'workout')
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
        .gte(
          'date',
          format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        )
        .order('date', { ascending: true }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select(
          'step_goal, coding_goal_minutes, units, workout_reminder_enabled'
        )
        .eq('user_id', user.id)
        .single(),
    ])

  const answeredDates = (workoutCheckins || [])
    .filter((row) => workoutAnswerFromValue(row.value_json) != null)
    .map((row) => row.date)

  const streak = computeWorkoutConsistencyStreak(answeredDates, today)
  const yesThisWeek = workoutsYesThisWeek(workoutCheckins || [], today)
  const todayWorkout = todayCheckins?.find((c) => c.type === 'workout')
  const initialAnswer = workoutAnswerFromValue(todayWorkout?.value_json)

  const stepGoal = profile?.step_goal || 10000
  const codingGoal = profile?.coding_goal_minutes || 240
  const unitsLabel = profile?.units === 'metric' ? 'kg' : 'lbs'
  const reminderEnabled = Boolean(profile?.workout_reminder_enabled)

  const latestWeightValue = latestWeight?.value_json?.value
  const stepsTodayValue = todayCheckins?.find((c) => c.type === 'steps')?.value_json?.value
  const caloriesTodayValue = todayCheckins?.find((c) => c.type === 'calories')?.value_json?.value
  const codingTodayValue = todayCheckins?.find((c) => c.type === 'coding_minutes')?.value_json?.value

  const chartData =
    weightData?.map((item) => ({
      date: item.date,
      value: item.value_json?.value || 0,
    })) || []

  const percent = (value: number, max: number) => {
    if (!max) return 0
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">TODAY</div>
        <h1 className="mt-1 text-2xl font-semibold">{format(new Date(), 'EEEE, MMM d')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {yesThisWeek} workout{yesThisWeek === 1 ? '' : 's'} this week
        </p>
      </div>

      <WorkoutTodayCard
        initialAnswer={initialAnswer}
        initialStreak={streak}
        reminderEnabled={reminderEnabled}
      />

      {!reminderEnabled && (
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <Bell className="h-5 w-5 shrink-0" />
          <span>
            <span className="font-semibold">Enable workout reminders</span>
            <span className="block text-amber-800/80">
              Your failure mode is not opening the app — fix that here.
            </span>
          </span>
          <ChevronRight className="ml-auto h-5 w-5 shrink-0 opacity-60" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/check-ins"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white shadow-sm"
        >
          <div className="text-xs font-semibold opacity-90">Weight</div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-3xl font-semibold">{latestWeightValue ?? '—'}</div>
            <div className="pb-1 text-sm opacity-90">{unitsLabel}</div>
          </div>
        </Link>

        <Link href="/check-ins" className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm">
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Footprints className="h-5 w-5" />
          </div>
          <div className="mt-12 text-xs font-semibold text-muted-foreground">Steps</div>
          <div className="mt-2 text-2xl font-semibold">
            {stepsTodayValue ? Number(stepsTodayValue).toLocaleString() : '—'}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${stepsTodayValue ? percent(Number(stepsTodayValue), stepGoal) : 0}%` }}
            />
          </div>
        </Link>

        <Link href="/meals" className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm">
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-600">
            <Flame className="h-5 w-5" />
          </div>
          <div className="mt-12 text-xs font-semibold text-muted-foreground">Calories</div>
          <div className="mt-2 text-2xl font-semibold">{caloriesTodayValue ?? '—'}</div>
        </Link>

        <Link href="/check-ins" className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm">
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="mt-12 text-xs font-semibold text-muted-foreground">Coding</div>
          <div className="mt-2 text-2xl font-semibold">
            {codingTodayValue ? `${(Number(codingTodayValue) / 60).toFixed(1)} hr` : '—'}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${codingTodayValue ? percent(Number(codingTodayValue), codingGoal) : 0}%` }}
            />
          </div>
        </Link>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="text-sm font-semibold">Weight Trend</div>
          <div className="text-xs text-muted-foreground">Last 30 days</div>
          <div className="mt-3">
            <WeightChart data={chartData} />
          </div>
        </div>
      )}

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Active Goals</div>
            <div className="text-xs text-muted-foreground">Secondary — workout first</div>
          </div>
          <Link href="/goals" className="text-muted-foreground">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {(goals || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No active goals yet.</div>
          ) : (
            (goals || []).slice(0, 2).map((goal) => (
              <div key={goal.id} className="rounded-2xl border bg-muted/30 p-3">
                <div className="text-sm font-semibold">{goal.title}</div>
                <div className="text-xs text-muted-foreground">
                  {goal.end_date ? format(new Date(goal.end_date), 'MMM d, yyyy') : goal.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { TrendingUp, ChevronRight, Footprints, Flame, Code2, Pencil, CheckSquare } from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  // Get today's check-ins
  const { data: todayCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)

  // Get weight check-ins for streak calculation
  const { data: weightCheckins } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .order('date', { ascending: false })
    .limit(30)

  // Calculate current streak (consecutive days with weight logged)
  let streak = 0
  if (weightCheckins && weightCheckins.length > 0) {
    const sortedDates = weightCheckins.map((c) => c.date).sort().reverse()
    let currentDate = new Date(today)
    for (const dateStr of sortedDates) {
      const checkDate = new Date(dateStr)
      if (format(currentDate, 'yyyy-MM-dd') === dateStr) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Get latest weight
  const { data: latestWeight } = await supabase
    .from('checkins')
    .select('value_json')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Get weight data for chart (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: weightData } = await supabase
    .from('checkins')
    .select('date, value_json')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  const chartData =
    weightData?.map((item) => ({
      date: item.date,
      value: item.value_json?.value || 0,
    })) || []

  // Get active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get user profile for goals
  const { data: profile } = await supabase
    .from('profiles')
    .select('step_goal, coding_goal_minutes')
    .eq('user_id', user.id)
    .single()

  const stepGoal = profile?.step_goal || 10000
  const codingGoal = profile?.coding_goal_minutes || 240

  const latestWeightValue = latestWeight?.value_json?.value
  const stepsTodayValue = todayCheckins?.find((c) => c.type === 'steps')?.value_json?.value
  const caloriesTodayValue = todayCheckins?.find((c) => c.type === 'calories')?.value_json?.value
  const codingTodayValue = todayCheckins?.find((c) => c.type === 'coding_minutes')?.value_json?.value

  const doneCount = [latestWeightValue, stepsTodayValue, caloriesTodayValue, codingTodayValue].filter(
    (v) => v != null && v !== '' && v !== 0
  ).length

  const percent = (value: number, max: number) => {
    if (!max) return 0
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  }

  const activeGoals =
    (goals || []).map((goal) => {
      const start = goal.start_date ? new Date(goal.start_date) : null
      const end = goal.end_date ? new Date(goal.end_date) : null
      const now = new Date()
      let pct: number | null = null
      if (start && end && end.getTime() > start.getTime()) {
        pct = percent(now.getTime() - start.getTime(), end.getTime() - start.getTime())
      }
      return { ...goal, progressPercent: pct }
    }) || []

  return (
    <div className="space-y-4">
      {/* Today header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground">TODAY</div>
          <h1 className="mt-1 text-2xl font-semibold">{format(new Date(), 'EEEE, MMM d')}</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm font-medium text-muted-foreground">
          <Pencil className="h-4 w-4" />
          Edit View
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Today&apos;s Check-in</div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {doneCount}/4 Done
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/check-ins?type=weight"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white shadow-sm"
        >
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
            <div className="h-5 w-5 rounded-md bg-white/20" />
          </div>
          <div className="mt-12 text-xs font-semibold opacity-90">Weight</div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-3xl font-semibold">{latestWeightValue ?? '—'}</div>
            <div className="pb-1 text-sm opacity-90">lbs</div>
          </div>
        </Link>

        <Link
          href="/check-ins?type=steps"
          className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm"
        >
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Footprints className="h-5 w-5" />
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {stepsTodayValue ? `${percent(Number(stepsTodayValue), stepGoal)}%` : '—'}
          </div>
          <div className="mt-12 text-xs font-semibold text-muted-foreground">Steps</div>
          <div className="mt-2 text-2xl font-semibold">{stepsTodayValue ? Number(stepsTodayValue).toLocaleString() : '—'}</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${stepsTodayValue ? percent(Number(stepsTodayValue), stepGoal) : 0}%` }}
            />
          </div>
        </Link>

        <Link
          href="/check-ins?type=calories"
          className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm"
        >
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-600">
            <Flame className="h-5 w-5" />
          </div>
          <div className="mt-12 text-xs font-semibold text-muted-foreground">Calories</div>
          <div className="mt-2 text-2xl font-semibold">{caloriesTodayValue ?? '—'}</div>
        </Link>

        <Link
          href="/check-ins?type=coding_minutes"
          className="relative overflow-hidden rounded-3xl border bg-background p-4 shadow-sm"
        >
          <div className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <span className="text-[10px] font-bold">✓</span>
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

      {/* Weight Trend */}
      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Weight Trend</div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <WeightChart data={chartData} />
        </div>
      </div>

      {/* Streak */}
      <div className="relative overflow-hidden rounded-3xl border bg-orange-50 p-5 shadow-sm">
        <div className="text-sm font-semibold">Current Streak</div>
        <div className="text-xs text-muted-foreground">You&apos;re crushing it!</div>
        <div className="mt-4 flex items-end gap-3">
          <div className="text-5xl font-semibold text-orange-600">{streak}</div>
          <div className="pb-2 text-sm font-semibold">DAYS</div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Keep logging weight daily.</span>
        </div>
      </div>

      {/* Active Goals */}
      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Active Goals</div>
            <div className="text-xs text-muted-foreground">Your current goals</div>
          </div>
          <Link href="/goals" className="text-muted-foreground">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {activeGoals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active goals yet.</div>
          ) : (
            activeGoals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="rounded-2xl border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {goal.end_date ? format(new Date(goal.end_date), 'MMM d, yyyy') : goal.category}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    {goal.progressPercent != null ? `${goal.progressPercent}%` : ''}
                  </div>
                </div>
                {goal.progressPercent != null && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <Link
          href="/goals/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed bg-background px-4 py-3 text-sm font-semibold text-muted-foreground"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted">+</span>
          Add New Goal
        </Link>
      </div>
    </div>
  )
}

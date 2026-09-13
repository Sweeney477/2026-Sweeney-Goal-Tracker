import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Flame, Trophy, ChevronRight } from 'lucide-react'
import { GoalPlanDisplay } from '@/components/goal-plan-display'
import { format } from 'date-fns'
import { computeGoalProgress } from '@/lib/goals/progress'
import { latestByTrackerFromCheckins } from '@/lib/goals/latest-readings'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()


  if (!user) {
    return null
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: weightCheckins } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .order('date', { ascending: false })
    .limit(60)

  let streak = 0
  if (weightCheckins && weightCheckins.length > 0) {
    const sortedDates = weightCheckins.map((c) => c.date).sort().reverse()
    let currentDate = new Date(today)
    for (const dateStr of sortedDates) {
      if (format(currentDate, 'yyyy-MM-dd') === dateStr) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  const { count: checkinCount } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const level = Math.max(1, Math.floor(((checkinCount || 0) as number) / 25) + 1)
  const levelLabel = level >= 10 ? 'Master' : level >= 5 ? 'Builder' : 'Starter'

  const [{ data: goals, error }, { data: recentCheckins }] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('checkins')
      .select('type, value_json, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(40),
  ])

  const latestByTracker = latestByTrackerFromCheckins(recentCheckins)

  if (error) {
    console.error('Error loading goals', error)
    return (
      <div className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="text-lg font-semibold">Goals</div>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t load your goals. {error.message || 'Please refresh and try again.'}
        </p>
        <div className="mt-4">
          <Link href="/goals/new">
            <Button className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch goal plans for each goal
  const goalsWithPlans = await Promise.all(
    (goals || []).map(async (goal) => {
      const { data: plan, error: planError } = await supabase
        .from('goal_plans')
        .select('*')
        .eq('goal_id', goal.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planError) {
        console.error('Error loading goal plan', { goalId: goal.id, planError })
      }

      return { ...goal, plan: plan?.plan_json || null }
    })
  )


  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your Goals</h1>
          <p className="text-sm text-muted-foreground">Keep pushing, you&apos;re doing great!</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-sm font-semibold">
          {user.email?.slice(0, 2).toUpperCase() || 'U'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-600">
            <Flame className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-muted-foreground">STREAK</div>
            <div className="text-sm font-semibold">{streak} Days</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yellow-50 text-yellow-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-muted-foreground">LEVEL</div>
            <div className="text-sm font-semibold">
              {levelLabel} <span className="text-muted-foreground">({level})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {goalsWithPlans.length === 0 ? (
          <div className="rounded-3xl border bg-background p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No goals yet. Create your first goal to get started.
            </p>
            <Link href="/goals/new" className="mt-4 inline-flex">
              <Button className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </Link>
          </div>
        ) : (
          goalsWithPlans.map((goal, idx) => {
            const progress = computeGoalProgress(goal, latestByTracker)

            return (
              <div key={goal.id} className="rounded-3xl border bg-background p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">{goal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {goal.category}
                          {goal.target ? ` • ${goal.target}` : ''}
                        </div>
                      </div>
                      {progress.outcomePercent != null ? (
                        <div className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">
                          {progress.outcomePercent}% outcome
                        </div>
                      ) : progress.timeElapsedPercent != null ? (
                        <div className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {progress.timeElapsedPercent}% time
                        </div>
                      ) : null}
                    </div>

                    {progress.outcomePercent != null ? (
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${progress.outcomePercent}%` }} />
                      </div>
                    ) : progress.timeElapsedPercent != null ? (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-muted-foreground">{progress.outcomeLabel}</div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${progress.timeElapsedPercent}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-muted-foreground">{progress.outcomeLabel}</div>
                    )}

                    {(goal.plan || goal.target) && (
                      <details className="mt-3 rounded-2xl border bg-muted/20 p-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                          Plan
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </summary>
                        <div className="mt-3 space-y-3">
                          {goal.target && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground">Target</div>
                              <div className="text-sm">{goal.target}</div>
                            </div>
                          )}
                          {goal.plan && <GoalPlanDisplay plan={goal.plan} />}
                        </div>
                      </details>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Link href={`/goals/${goal.id}/edit`}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Link
        href="/goals/new"
        className="flex items-center justify-center gap-2 rounded-2xl border bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-sm"
      >
        <Plus className="h-5 w-5" />
        New Goal
      </Link>
    </div>
  )
}


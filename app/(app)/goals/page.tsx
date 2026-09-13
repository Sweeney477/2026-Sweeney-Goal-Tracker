import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { GoalPlanDisplay } from '@/components/goal-plan-display'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { SoftCard } from '@/components/soft-ui'
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
      <SoftCard className="p-5">
        <div className="font-display text-lg font-semibold">Goals</div>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t load your goals. {error.message || 'Please refresh and try again.'}
        </p>
        <div className="mt-4">
          <Link href="/goals/new">
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </Link>
        </div>
      </SoftCard>
    )
  }

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

  const goalPastels = ['mint', 'lilac', 'sky', 'peach', 'butter'] as const

  return (
    <div className="space-y-7">
      <PageHeader
        title="Goals"
        description="Outcomes you are working toward, with optional tracking plans."
        action={
          goalsWithPlans.length > 0 ? (
            <Link href="/goals/new">
              <Button className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                New goal
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {goalsWithPlans.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No goals yet"
              description="Create a goal to track outcomes alongside daily logs."
              action={
                <Link href="/goals/new">
                  <Button className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create goal
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          goalsWithPlans.map((goal, idx) => {
            const progress = computeGoalProgress(goal, latestByTracker)
            const tone = goalPastels[idx % goalPastels.length]

            return (
              <SoftCard key={goal.id} tone={tone} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 text-sm font-semibold text-brand">
                    <span>{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-display text-base font-semibold">{goal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {goal.category}
                          {goal.target ? ` • ${goal.target}` : ''}
                        </div>
                      </div>
                      {progress.outcomePercent != null ? (
                        <div className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-brand">
                          {progress.outcomePercent}%
                        </div>
                      ) : progress.timeElapsedPercent != null ? (
                        <div className="rounded-full bg-white/50 px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {progress.timeElapsedPercent}% time
                        </div>
                      ) : null}
                    </div>

                    {progress.outcomePercent != null ? (
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${progress.outcomePercent}%` }}
                        />
                      </div>
                    ) : progress.timeElapsedPercent != null ? (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-muted-foreground">{progress.outcomeLabel}</div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                          <div
                            className="h-full rounded-full bg-muted-foreground/40"
                            style={{ width: `${progress.timeElapsedPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-muted-foreground">{progress.outcomeLabel}</div>
                    )}

                    {(goal.plan || goal.target) && (
                      <details className="mt-3 rounded-2xl bg-white/50 p-3">
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
                        <Button variant="outline" size="sm" className="rounded-full bg-white/70">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SoftCard>
            )
          })
        )}
      </div>
    </div>
  )
}

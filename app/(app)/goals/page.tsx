import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GoalPlanDisplay } from '@/components/goal-plan-display'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()


  if (!user) {
    return null
  }

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })


  if (error) {
    console.error('Error loading goals', error)
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>We couldn&apos;t load your goals.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {error.message || 'Please refresh and try again.'}
              </p>
              <div className="mt-4">
                <Link href="/goals/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Goal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground mt-1">
              Manage your goals and tracking plans
            </p>
          </div>
          <Link href="/goals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {goalsWithPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No goals yet. Create your first goal to get started.
                </p>
                <Link href="/goals/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            goalsWithPlans.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle>{goal.title}</CardTitle>
                  <CardDescription>{goal.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  {goal.target && (
                    <div className="mb-4">
                      <div className="text-sm font-medium">Target</div>
                      <div className="text-muted-foreground">{goal.target}</div>
                    </div>
                  )}
                  {goal.plan && <GoalPlanDisplay plan={goal.plan} />}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/goals/${goal.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


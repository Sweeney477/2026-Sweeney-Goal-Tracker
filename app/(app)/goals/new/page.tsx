'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoalPlanDisplay } from '@/components/goal-plan-display'
import { TrackingPlan } from '@/lib/types'
import { toast } from '@/components/ui/toast'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function NewGoalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [goalText, setGoalText] = useState('')
  const [category, setCategory] = useState('')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [plan, setPlan] = useState<TrackingPlan | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  const generatePlan = async () => {
    if (!goalText.trim()) return

    setGeneratingPlan(true)
    try {
      const response = await fetch(`${BASE_PATH}/api/ai/goal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate plan')
      }

      const data = await response.json()
      setPlan(data.plan)
    } catch (error: any) {
      console.error('Error generating plan:', error)
      const errorMessage = error.message || 'Failed to generate plan. Please try again.'
      if (errorMessage.includes('Rate limit')) {
        toast('Rate limit exceeded. Please try again later.', 'error')
      } else {
        toast(errorMessage, 'error')
      }
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalText,
          category: category || 'General',
          target: target || null,
        })
        .select()
        .single()

      if (goalError) throw goalError

      // Save plan if we have one
      if (plan && goal) {
        const { error: planError } = await supabase.from('goal_plans').insert({
          goal_id: goal.id,
          plan_json: plan,
        })

        if (planError) throw planError
      }

      router.push('/goals')
    } catch (error) {
      console.error('Error creating goal:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create goal. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Goal</h1>
          <p className="text-muted-foreground mt-1">
            Create a new goal and get an AI-generated tracking plan
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalText">Goal (plain English)</Label>
                <Input
                  id="goalText"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="e.g., Lose 20 pounds by June"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Fitness, Health, Career"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target (optional)</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g., 180 lbs by June 1, 2026"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generatePlan}
                disabled={generatingPlan || !goalText.trim()}
              >
                {generatingPlan ? 'Generating...' : 'Generate Tracking Plan'}
              </Button>
            </CardContent>
          </Card>

          {plan && (
            <div>
              <GoalPlanDisplay plan={plan} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


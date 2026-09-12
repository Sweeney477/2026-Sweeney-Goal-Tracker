'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoalPlanDisplay } from '@/components/goal-plan-display'
import { TrackingPlan } from '@/lib/types'
import { toast } from '@/components/ui/toast'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

type GoalRow = {
  id: string
  title: string
  category: string
  target: string | null
  start_date: string | null
  end_date: string | null
}

export default function EditGoalPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const goalId = params?.id

  const supabase = useMemo(() => createClient(), [])

  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [goalText, setGoalText] = useState('')
  const [category, setCategory] = useState('')
  const [target, setTarget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [existingPlan, setExistingPlan] = useState<TrackingPlan | null>(null)
  const [plan, setPlan] = useState<TrackingPlan | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!goalId) return
      setInitialLoading(true)
      setErrorMessage(null)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: goal, error: goalError } = await supabase
          .from('goals')
          .select('id,title,category,target,start_date,end_date')
          .eq('id', goalId)
          .maybeSingle()

        if (goalError) throw goalError
        if (!goal) {
          setErrorMessage('Goal not found (or you do not have access).')
          return
        }

        const { data: planRow, error: planError } = await supabase
          .from('goal_plans')
          .select('plan_json')
          .eq('goal_id', goalId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (planError) {
          // Non-fatal; editing goal should still work without plan.
          console.error('Error loading goal plan', planError)
        }

        if (cancelled) return

        const g = goal as GoalRow
        setGoalText(g.title || '')
        setCategory(g.category || '')
        setTarget(g.target || '')
        setStartDate(g.start_date || '')
        setEndDate(g.end_date || '')
        setExistingPlan((planRow?.plan_json as TrackingPlan) || null)
      } catch (err) {
        console.error('Error loading goal:', err)
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load goal.')
        }
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [goalId, router, supabase])

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
      const msg = error?.message || 'Failed to generate plan. Please try again.'
      if (msg.includes('Rate limit')) {
        toast('Rate limit exceeded. Please try again later.', 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const updates = {
        title: goalText,
        category: category || 'General',
        target: target || null,
        start_date: startDate || null,
        end_date: endDate || null,
      }

      const { error: updateError } = await supabase.from('goals').update(updates).eq('id', goalId)
      if (updateError) throw updateError

      // If user generated a new plan during edit, save it as a new plan record.
      if (plan) {
        const { error: planError } = await supabase.from('goal_plans').insert({
          goal_id: goalId,
          plan_json: plan,
        })
        if (planError) throw planError
      }

      router.push('/goals')
      router.refresh()
    } catch (err) {
      console.error('Error updating goal:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update goal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Goal</h1>
            <p className="text-muted-foreground mt-1">Loading…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Goal</h1>
          <p className="text-muted-foreground mt-1">Update your goal details and optionally regenerate your plan</p>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date (optional)</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date (optional)</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={generatePlan}
                disabled={generatingPlan || !goalText.trim()}
              >
                {generatingPlan ? 'Generating...' : 'Generate New Tracking Plan'}
              </Button>
            </CardContent>
          </Card>

          {(plan || existingPlan) && (
            <div className="space-y-4">
              {plan && <GoalPlanDisplay plan={plan} />}
              {!plan && existingPlan && <GoalPlanDisplay plan={existingPlan} />}
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
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}



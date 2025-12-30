'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type TileType = 'weight' | 'steps' | 'food' | 'workout' | 'code'

type QuickInputs = {
  weight: { value: string; notes: string }
  steps: { value: string; notes: string }
  food: { name: string; calories: string; notes: string }
  workout: { type: string; duration: string; notes: string }
  code: { minutes: string; project: string; notes: string }
}

const tileMeta: Record<
  TileType,
  { label: string; helper: string; accent: string; metricLabel: string }
> = {
  weight: {
    label: 'Weight',
    helper: 'Tap to log today’s weight',
    accent: 'from-blue-500/10 to-blue-500/20',
    metricLabel: 'lbs',
  },
  steps: {
    label: 'Steps',
    helper: 'Auto-fills with today’s steps if present',
    accent: 'from-emerald-500/10 to-emerald-500/20',
    metricLabel: 'steps',
  },
  food: {
    label: 'Food',
    helper: 'Save a quick meal with calories & name',
    accent: 'from-amber-500/10 to-amber-500/20',
    metricLabel: 'cal',
  },
  workout: {
    label: 'Workout',
    helper: 'Remembers your last workout type',
    accent: 'from-violet-500/10 to-violet-500/20',
    metricLabel: 'type',
  },
  code: {
    label: 'Code',
    helper: 'Quickly log coding minutes + project',
    accent: 'from-indigo-500/10 to-indigo-500/20',
    metricLabel: 'min',
  },
}

export default function CheckInsPage() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingTile, setSavingTile] = useState<TileType | null>(null)
  const [activeTile, setActiveTile] = useState<TileType | null>(null)

  const [suggestions, setSuggestions] = useState({
    weight: '',
    steps: '',
    workoutType: '',
    codingMinutes: '',
    project: '',
    meals: [] as string[],
    mealCalories: '',
  })

  const [inputs, setInputs] = useState<QuickInputs>({
    weight: { value: '', notes: '' },
    steps: { value: '', notes: '' },
    food: { name: '', calories: '', notes: '' },
    workout: { type: '', duration: '', notes: '' },
    code: { minutes: '', project: '', notes: '' },
  })

  const [lastValues, setLastValues] = useState<Record<TileType, string>>({
    weight: '—',
    steps: '—',
    food: '—',
    workout: '—',
    code: '—',
  })

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: checkinData }, { data: mealData }, { data: projectData }] = await Promise.all([
        supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
          .limit(60),
        supabase
          .from('meals')
          .select('name, calories, consumed_at')
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: false })
          .limit(10),
        supabase
          .from('projects')
          .select('name, status, week_start')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(5),
      ])

      const data = checkinData || []
      setCheckins(data)

      const latestWeight = data.find((c) => c.type === 'weight')
      const latestSteps = data.find((c) => c.type === 'steps')
      const stepsToday = data.find((c) => c.type === 'steps' && c.date === today)
      const latestWorkout = data.find((c) => c.type === 'workout')
      const latestCoding = data.find((c) => c.type === 'coding_minutes')
      const latestCalories = data.find((c) => c.type === 'calories')

      const meals = mealData || []
      const firstMealName = meals.find((m) => m.name)?.name || ''
      const firstMealCalories = meals.find((m) => m.calories)?.calories
      const uniqueMeals = Array.from(new Set(meals.map((m) => m.name).filter(Boolean))) as string[]

      const project =
        (projectData || []).find((p) => p.status === 'in_progress') ||
        (projectData || [])[0] ||
        null

      setSuggestions({
        weight: latestWeight?.value_json?.value ? String(latestWeight.value_json.value) : '',
        steps:
          stepsToday?.value_json?.value != null
            ? String(stepsToday.value_json.value)
            : latestSteps?.value_json?.value != null
            ? String(latestSteps.value_json.value)
            : '',
        workoutType: latestWorkout?.value_json?.type || '',
        codingMinutes: latestCoding?.value_json?.value ? String(latestCoding.value_json.value) : '',
        project: project?.name || '',
        meals: uniqueMeals.slice(0, 5),
        mealCalories: firstMealCalories ? String(firstMealCalories) : '',
      })

      setLastValues({
        weight: latestWeight?.value_json?.value ? `${latestWeight.value_json.value} lbs` : '—',
        steps: stepsToday?.value_json?.value
          ? `${stepsToday.value_json.value} steps`
          : latestSteps?.value_json?.value
          ? `${latestSteps.value_json.value} steps`
          : '—',
        food: firstMealName || latestCalories?.value_json?.name || '—',
        workout: latestWorkout?.value_json?.type || '—',
        code:
          project?.name && latestCoding?.value_json?.value
            ? `${project.name} • ${latestCoding.value_json.value} min`
            : project?.name || latestCoding?.value_json?.value
            ? `${latestCoding?.value_json?.value || ''} ${
                latestCoding?.value_json?.value ? 'min' : ''
              }`.trim() || '—'
            : '—',
      })

      // Prefill inputs only if empty, so we don't overwrite current edits
      setInputs((prev) => ({
        weight: {
          ...prev.weight,
          value:
            prev.weight.value ||
            (latestWeight?.value_json?.value != null ? String(latestWeight.value_json.value) : ''),
        },
        steps: {
          ...prev.steps,
          value:
            prev.steps.value ||
            (stepsToday?.value_json?.value != null
              ? String(stepsToday.value_json.value)
              : latestSteps?.value_json?.value != null
              ? String(latestSteps.value_json.value)
              : ''),
        },
        food: {
          ...prev.food,
          name: prev.food.name || firstMealName || '',
          calories:
            prev.food.calories ||
            (firstMealCalories != null ? String(firstMealCalories) : '') ||
            '',
        },
        workout: {
          ...prev.workout,
          type: prev.workout.type || latestWorkout?.value_json?.type || '',
          duration:
            prev.workout.duration ||
            (latestWorkout?.value_json?.duration_min != null
              ? String(latestWorkout.value_json.duration_min)
              : ''),
        },
        code: {
          ...prev.code,
          minutes:
            prev.code.minutes ||
            (latestCoding?.value_json?.value != null ? String(latestCoding.value_json.value) : ''),
          project: prev.code.project || project?.name || '',
        },
      }))
    } catch (error) {
      console.error('Error loading check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSubmit = async (tile: TileType) => {
    setSavingTile(tile)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (tile === 'weight') {
        const value = parseFloat(inputs.weight.value || suggestions.weight || '0')
        if (!value) throw new Error('Enter a weight')
        const { error } = await supabase.from('checkins').upsert({
          user_id: user.id,
          date: today,
          type: 'weight',
          value_json: { value },
          notes: inputs.weight.notes || null,
        })
        if (error) throw error
      }

      if (tile === 'steps') {
        const value = parseInt(inputs.steps.value || suggestions.steps || '0', 10)
        if (!value) throw new Error('Enter steps')
        const { error } = await supabase.from('checkins').upsert({
          user_id: user.id,
          date: today,
          type: 'steps',
          value_json: { value },
          notes: inputs.steps.notes || null,
        })
        if (error) throw error
      }

      if (tile === 'food') {
        const name = inputs.food.name || suggestions.meals[0] || 'Meal'
        const calories = inputs.food.calories ? parseInt(inputs.food.calories, 10) : null
        const { error: mealError } = await supabase.from('meals').insert({
          user_id: user.id,
          consumed_at: new Date().toISOString(),
          name,
          calories,
          notes: inputs.food.notes || null,
        })
        if (mealError) throw mealError

        const { error: caloriesError } = await supabase.from('checkins').upsert({
          user_id: user.id,
          date: today,
          type: 'calories',
          value_json: { value: calories ?? 0, name },
          notes: inputs.food.notes || null,
        })
        if (caloriesError) console.error('Calorie check-in optional error:', caloriesError.message)
      }

      if (tile === 'workout') {
        const type = inputs.workout.type || suggestions.workoutType || 'Workout'
        const duration = inputs.workout.duration ? parseInt(inputs.workout.duration, 10) : null
      const { error } = await supabase.from('checkins').upsert({
        user_id: user.id,
          date: today,
          type: 'workout',
          value_json: { type, duration_min: duration || undefined },
          notes: inputs.workout.notes || null,
        })
        if (error) throw error
      }

      if (tile === 'code') {
        const minutes = inputs.code.minutes || suggestions.codingMinutes || '0'
        const value = parseInt(minutes, 10)
        if (!value) throw new Error('Enter coding minutes')
        const project = inputs.code.project || suggestions.project || 'Project'
        const { error } = await supabase.from('checkins').upsert({
          user_id: user.id,
          date: today,
          type: 'coding_minutes',
          value_json: { value, project },
          notes: inputs.code.notes || null,
        })
      if (error) throw error
      }

      setActiveTile(null)
      void loadData()
    } catch (error) {
      console.error('Error saving check-in:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setSavingTile(null)
    }
  }

  const tileList: TileType[] = ['weight', 'steps', 'food', 'workout', 'code']

  const recentActivity = useMemo(
    () => checkins.slice(0, 15).map((c) => ({ ...c, displayDate: format(new Date(c.date), 'MMM d') })),
    [checkins]
  )

  const renderForm = () => {
    if (!activeTile) return null

    if (activeTile === 'weight' || activeTile === 'steps') {
      const field = activeTile === 'weight' ? inputs.weight : inputs.steps
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{activeTile === 'weight' ? 'Weight (lbs)' : 'Steps'}</Label>
            <Input
              type="number"
              value={field.value}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  [activeTile]: { ...field, value: e.target.value },
                }))
              }
              placeholder={
                activeTile === 'weight'
                  ? suggestions.weight || 'e.g., 185.2'
                  : suggestions.steps || 'e.g., 8000'
              }
            />
            <p className="text-xs text-muted-foreground">
              Suggested: {activeTile === 'weight' ? suggestions.weight || '—' : suggestions.steps || '—'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={field.notes}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  [activeTile]: { ...field, notes: e.target.value },
                }))
              }
              placeholder="Add context"
            />
          </div>
          <Button onClick={() => void handleQuickSubmit(activeTile)} disabled={savingTile === activeTile}>
            {savingTile === activeTile ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    if (activeTile === 'food') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meal name</Label>
            <Input
              value={inputs.food.name}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  food: { ...prev.food, name: e.target.value },
                }))
              }
              placeholder={suggestions.meals[0] || 'e.g., Chicken bowl'}
            />
            {suggestions.meals.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {suggestions.meals.map((meal) => (
                  <Button
                    key={meal}
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setInputs((prev) => ({
                        ...prev,
                        food: { ...prev.food, name: meal },
                      }))
                    }
                  >
                    {meal}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Calories (optional)</Label>
            <Input
              type="number"
              value={inputs.food.calories}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  food: { ...prev.food, calories: e.target.value },
                }))
              }
              placeholder={suggestions.mealCalories || 'e.g., 650'}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <textarea
              value={inputs.food.notes}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  food: { ...prev.food, notes: e.target.value },
                }))
              }
              placeholder="Add quick context"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={() => void handleQuickSubmit('food')} disabled={savingTile === 'food'}>
            {savingTile === 'food' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    if (activeTile === 'workout') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workout type</Label>
            <Input
              value={inputs.workout.type}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  workout: { ...prev.workout, type: e.target.value },
                }))
              }
              placeholder={suggestions.workoutType || 'e.g., Upper Body'}
            />
            <p className="text-xs text-muted-foreground">
              Suggested: {suggestions.workoutType || '—'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={inputs.workout.duration}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  workout: { ...prev.workout, duration: e.target.value },
                }))
              }
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={inputs.workout.notes}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  workout: { ...prev.workout, notes: e.target.value },
                }))
              }
              placeholder="Add context"
            />
          </div>
          <Button onClick={() => void handleQuickSubmit('workout')} disabled={savingTile === 'workout'}>
            {savingTile === 'workout' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    if (activeTile === 'code') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Coding minutes</Label>
            <Input
              type="number"
              value={inputs.code.minutes}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  code: { ...prev.code, minutes: e.target.value },
                }))
              }
              placeholder={suggestions.codingMinutes || 'e.g., 90'}
            />
            <p className="text-xs text-muted-foreground">
              Suggested: {suggestions.codingMinutes || '—'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Input
              value={inputs.code.project}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  code: { ...prev.code, project: e.target.value },
                }))
              }
              placeholder={suggestions.project || 'Project name'}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={inputs.code.notes}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  code: { ...prev.code, notes: e.target.value },
                }))
              }
              placeholder="What you shipped today?"
            />
          </div>
          <Button onClick={() => void handleQuickSubmit('code')} disabled={savingTile === 'code'}>
            {savingTile === 'code' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Daily check-in</h1>
          <p className="text-muted-foreground mt-1">
            One tap → quick input → done. Prefilled with your latest data.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today’s tiles</CardTitle>
            <CardDescription>Tap a tile to log in seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {tileList.map((tile) => (
                <button
                  key={tile}
                  onClick={() => setActiveTile(tile)}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border p-4 text-left transition hover:shadow-sm',
                    activeTile === tile ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-60 transition group-hover:opacity-100',
                      tileMeta[tile].accent
                    )}
                  />
                  <div className="relative space-y-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {tileMeta[tile].label}
                    </div>
                    <div className="text-2xl font-bold">
                      {lastValues[tile] || '—'}
              </div>
                    <div className="text-xs text-muted-foreground">
                      {tileMeta[tile].helper}
              </div>
              </div>
                </button>
              ))}
              </div>
          </CardContent>
        </Card>

        {activeTile && (
          <Card>
            <CardHeader>
              <CardTitle>Quick log: {tileMeta[activeTile].label}</CardTitle>
              <CardDescription>Defaults are pre-filled from your latest entries.</CardDescription>
            </CardHeader>
            <CardContent>{renderForm()}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Today + latest check-ins across all types.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-muted-foreground text-sm">No check-ins yet.</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium capitalize">{checkin.type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{checkin.displayDate}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                      {checkin.value_json?.value || checkin.value_json?.type || '—'}{' '}
                      {checkin.type === 'weight' && 'lbs'}
                      {checkin.type === 'steps' && 'steps'}
                      {checkin.type === 'calories' && 'cal'}
                      {checkin.type === 'coding_minutes' && 'min'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


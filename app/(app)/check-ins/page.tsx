'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, ChevronRight } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { trackerFromQuery, focusTileIds, trackerById, trackers } from '@/lib/config/trackers'
import { normalizeUnits, weightUnitLabel, type UnitSystem } from '@/lib/units'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import { LoadingState } from '@/components/loading-state'

type TileType = 'weight' | 'steps' | 'food' | 'workout' | 'code'

type QuickInputs = {
  weight: { value: string; notes: string }
  steps: { value: string; notes: string }
  food: { name: string; calories: string; notes: string }
  workout: { type: string; duration: string; notes: string }
  code: { minutes: string; project: string; notes: string }
}

const trackerLabel = (id: TileType) => trackerById(id)?.label ?? id
const trackerHelper = (id: TileType) => trackerById(id)?.helper ?? ''

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
  const [displayName, setDisplayName] = useState('Alex')
  const [units, setUnits] = useState<UnitSystem>('imperial')
  const searchParams = useSearchParams()
  const weightLabel = weightUnitLabel(units)

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const fromQuery = trackerFromQuery(searchParams.get('type'))
    if (fromQuery) setActiveTile(fromQuery)
  }, [searchParams])

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const nameFromEmail = (user.email || '')
        .split('@')[0]
        .split(/[.\-_]/)
        .filter(Boolean)[0]
      setDisplayName(user.user_metadata?.full_name || (nameFromEmail ? nameFromEmail[0].toUpperCase() + nameFromEmail.slice(1) : 'Alex'))

      const { data: profile } = await supabase
        .from('profiles')
        .select('units')
        .eq('user_id', user.id)
        .maybeSingle()
      const nextUnits = normalizeUnits(profile?.units)
      setUnits(nextUnits)
      const unitLabel = weightUnitLabel(nextUnits)

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
        weight: latestWeight?.value_json?.value ? `${latestWeight.value_json.value} ${unitLabel}` : '—',
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

      toast('Saved', 'success')
      setActiveTile(null)
      void loadData()
    } catch (error: any) {
      console.error('Error saving check-in:', error)
      toast(error.message || 'Failed to save. Please try again.', 'error')
    } finally {
      setSavingTile(null)
    }
  }

  const recentActivity = useMemo(
    () => checkins.slice(0, 15).map((c) => ({ ...c, displayDate: format(new Date(c.date), 'MMM d') })),
    [checkins]
  )

  const todayTypes = useMemo(() => {
    const todays = checkins.filter((c) => c.date === today)
    const set = new Set<string>(todays.map((c) => c.type))
    return set
  }, [checkins, today])

  const focusTiles = focusTileIds() as TileType[]
  const doneToday = focusTiles.filter((t) => {
    if (t === 'food') return false
    if (t === 'code') return todayTypes.has('coding_minutes')
    return todayTypes.has(t)
  }).length
  const focusPct = Math.round((doneToday / focusTiles.length) * 100)

  const streak = useMemo(() => {
    const weightDates = checkins.filter((c) => c.type === 'weight').map((c) => c.date)
    return calculateDailyStreak(weightDates, today)
  }, [checkins, today])

  const ProgressRing = ({ value }: { value: number }) => (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.25)" strokeWidth="6" fill="none" />
      <circle
        cx="28"
        cy="28"
        r="22"
        stroke="white"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 22}`}
        strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.max(0, Math.min(100, value)) / 100)}`}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">
        {value}%
      </text>
    </svg>
  )

  const renderForm = () => {
    if (!activeTile) return null

    if (activeTile === 'weight' || activeTile === 'steps') {
      const field = activeTile === 'weight' ? inputs.weight : inputs.steps
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{activeTile === 'weight' ? `Weight (${weightLabel})` : 'Steps'}</Label>
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
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold">Hello, {displayName}!</div>
          <div className="text-sm text-muted-foreground">Ready to crush today&apos;s goals?</div>
        </div>
        <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4" /> {streak} Day Streak
          </span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{format(new Date(), 'MMM d, EEEE')}</div>

      {/* Momentum hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-sm">
        <div className="text-xs font-semibold tracking-wide opacity-90">DAILY WIN</div>
        <div className="mt-2 text-2xl font-semibold">Keep the momentum!</div>
        <div className="mt-2 max-w-[22rem] text-sm opacity-90">
          Complete all check-ins to unlock a special daily achievement animation.
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">
            {doneToday}/{focusTiles.length} done
          </div>
          <ProgressRing value={focusPct} />
        </div>
      </div>
      <div className="pt-1 text-xs font-semibold tracking-wide text-muted-foreground">TODAY&apos;S FOCUS</div>

      {/* Focus tiles */}
      <div className="grid grid-cols-2 gap-3">
        {focusTiles.map((tile) => {
          const isDone =
            tile === 'code' ? todayTypes.has('coding_minutes') : todayTypes.has(tile)
          return (
            <button
              key={tile}
              onClick={() => setActiveTile(tile)}
              className={cn(
                'relative overflow-hidden rounded-3xl border bg-background p-4 text-left shadow-sm',
                activeTile === tile ? 'border-blue-600/40 ring-2 ring-blue-600/20' : ''
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', tileMeta[tile].accent)} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-background/70">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full border bg-background/70',
                      isDone ? 'text-emerald-600 border-emerald-600/30' : 'text-muted-foreground'
                    )}
                  >
                    {isDone ? '✓' : ''}
                  </div>
                </div>
                <div className="mt-4 text-sm font-semibold">{tileMeta[tile].label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{lastValues[tile] || '—'}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Food quick log as secondary */}
      <button
        type="button"
        onClick={() => setActiveTile('food')}
        className={cn(
          'flex items-center justify-between rounded-3xl border bg-background p-4 shadow-sm',
          activeTile === 'food' ? 'border-blue-600/40 ring-2 ring-blue-600/20' : ''
        )}
      >
        <div>
          <div className="text-sm font-semibold">Food</div>
          <div className="text-xs text-muted-foreground">{lastValues.food || 'Quick log a meal'}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {activeTile && (
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold">Quick log: {tileMeta[activeTile].label}</div>
          {renderForm()}
        </div>
      )}

      {/* Recent activity */}
      <div className="pt-2">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">RECENT ACTIVITY</div>
        <div className="mt-3 rounded-3xl border bg-background p-4 shadow-sm">
          {loading ? (
            <LoadingState label="Loading check-ins" />
          ) : recentActivity.length === 0 ? (
            <div className="text-sm text-muted-foreground">No check-ins yet.</div>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-2 top-1 h-full w-px bg-border" />
              <div className="space-y-4">
                {recentActivity.map((checkin) => (
                  <div key={checkin.id} className="relative">
                    <div className="absolute -left-[2px] top-1 grid h-3 w-3 place-items-center rounded-full bg-blue-600" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold capitalize">
                          {checkin.type.replace('_', ' ')}{' '}
                          <span className="ml-2 text-xs text-muted-foreground">{checkin.displayDate}</span>
                        </div>
                        {checkin.notes && (
                          <div className="truncate text-xs text-muted-foreground">{checkin.notes}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-sm text-muted-foreground">
                        {checkin.value_json?.value || checkin.value_json?.type || '—'}{' '}
                        {checkin.type === 'weight' && weightLabel}
                        {checkin.type === 'steps' && 'steps'}
                        {checkin.type === 'calories' && 'cal'}
                        {checkin.type === 'coding_minutes' && 'min'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import {
  trackerFromQuery,
  focusTileIds,
  trackerById,
  streakTracker,
  type QuickLogTileId,
} from '@/lib/config/trackers'
import { normalizeUnits, weightUnitLabel, type UnitSystem } from '@/lib/units'
import { calculateDailyStreak } from '@/lib/checkins/streak'
import {
  isTileDone,
  checkinTypeForTile,
  valueOf,
  todayTypes as todayTypesFromCheckins,
  latestOfType,
  type CheckinTileId,
} from '@/lib/checkins/domain'
import type { Checkin } from '@/lib/types'
import {
  listRecentCheckins,
  listMealSuggestions,
  listProjectSuggestions,
  upsertCheckin,
  insertMeal,
} from '@/lib/checkins/api'
import { dayRelativeLabel, localDayKey, resolveTimezone } from '@/lib/dates'

export type TileType = QuickLogTileId

export type QuickInputs = {
  weight: { value: string; notes: string }
  steps: { value: string; notes: string }
  food: { name: string; calories: string; notes: string }
  workout: { type: string; duration: string; notes: string }
  code: { minutes: string; project: string; notes: string }
}

export type CheckinSuggestions = {
  weight: string
  steps: string
  workoutType: string
  codingMinutes: string
  project: string
  meals: string[]
  mealCalories: string
}

export function tileMetaFor(
  id: TileType,
  units: UnitSystem
): { label: string; helper: string; accent: string; metricLabel: string } {
  const tracker = trackerById(id)
  return {
    label: tracker?.label ?? id,
    helper: tracker?.helper ?? '',
    accent: tracker?.accent ?? '',
    metricLabel: tracker?.metricLabel(units) ?? '',
  }
}

const emptyInputs = (): QuickInputs => ({
  weight: { value: '', notes: '' },
  steps: { value: '', notes: '' },
  food: { name: '', calories: '', notes: '' },
  workout: { type: '', duration: '', notes: '' },
  code: { minutes: '', project: '', notes: '' },
})

const emptyLastValues = (): Record<TileType, string> => ({
  weight: '—',
  steps: '—',
  food: '—',
  workout: '—',
  code: '—',
})

export function useCheckins() {
  const supabase = createClient()
  const [timeZone, setTimeZone] = useState(() => resolveTimezone())
  const [today, setToday] = useState(() => localDayKey(resolveTimezone()))

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [savingTile, setSavingTile] = useState<TileType | null>(null)
  const [activeTile, setActiveTile] = useState<TileType | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [units, setUnits] = useState<UnitSystem>('imperial')
  const searchParams = useSearchParams()
  const weightLabel = weightUnitLabel(units)

  const [suggestions, setSuggestions] = useState<CheckinSuggestions>({
    weight: '',
    steps: '',
    workoutType: '',
    codingMinutes: '',
    project: '',
    meals: [],
    mealCalories: '',
  })

  const [inputs, setInputs] = useState<QuickInputs>(emptyInputs)

  const [lastValues, setLastValues] = useState<Record<TileType, string>>(emptyLastValues)

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
      const metaName = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string
      const nameFromEmail = (user.email || '')
        .split('@')[0]
        .split(/[.\-_]/)
        .filter(Boolean)[0]
      const pretty =
        metaName.trim() ||
        (nameFromEmail
          ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1).toLowerCase()
          : 'there')
      setDisplayName(pretty)

      const { data: profile } = await supabase
        .from('profiles')
        .select('units, timezone')
        .eq('user_id', user.id)
        .maybeSingle()
      const nextUnits = normalizeUnits(profile?.units)
      setUnits(nextUnits)
      const tz = resolveTimezone(profile?.timezone)
      setTimeZone(tz)
      const day = localDayKey(tz)
      setToday(day)
      const unitLabel = weightUnitLabel(nextUnits)

      const [{ data: checkinData }, { data: mealData }, { data: projectData }] = await Promise.all([
        listRecentCheckins(supabase, user.id),
        listMealSuggestions(supabase, user.id),
        listProjectSuggestions(supabase, user.id),
      ])

      const data = (checkinData || []) as Checkin[]
      setCheckins(data)

      const latestWeight = latestOfType(data, 'weight')
      const latestSteps = latestOfType(data, 'steps')
      const stepsToday = data.find((c) => c.type === 'steps' && c.date === day)
      const latestWorkout = latestOfType(data, 'workout')
      const latestCoding = latestOfType(data, 'coding_minutes')
      const latestCalories = latestOfType(data, 'calories')

      const meals = mealData || []
      const firstMealName = meals.find((m) => m.name)?.name || ''
      const firstMealCalories = meals.find((m) => m.calories)?.calories
      const uniqueMeals = Array.from(new Set(meals.map((m) => m.name).filter(Boolean))) as string[]

      const project =
        (projectData || []).find((p) => p.status === 'in_progress') ||
        (projectData || [])[0] ||
        null

      const weightVal = valueOf(latestWeight)
      const stepsTodayVal = valueOf(stepsToday)
      const stepsLatestVal = valueOf(latestSteps)
      const workoutVal = valueOf(latestWorkout)
      const codingVal = valueOf(latestCoding)
      const caloriesVal = valueOf(latestCalories)

      setSuggestions({
        weight: weightVal?.value != null ? String(weightVal.value) : '',
        steps:
          stepsTodayVal?.value != null
            ? String(stepsTodayVal.value)
            : stepsLatestVal?.value != null
              ? String(stepsLatestVal.value)
              : '',
        workoutType: (workoutVal?.type as string) || '',
        codingMinutes: codingVal?.value != null ? String(codingVal.value) : '',
        project: project?.name || '',
        meals: uniqueMeals.slice(0, 5),
        mealCalories: firstMealCalories ? String(firstMealCalories) : '',
      })

      setLastValues({
        weight: weightVal?.value != null ? `${weightVal.value} ${unitLabel}` : '—',
        steps: stepsTodayVal?.value
          ? `${stepsTodayVal.value} steps`
          : stepsLatestVal?.value
            ? `${stepsLatestVal.value} steps`
            : '—',
        food: firstMealName || (caloriesVal?.name as string) || '—',
        workout: (workoutVal?.type as string) || '—',
        code:
          project?.name && codingVal?.value != null
            ? `${project.name} • ${codingVal.value} min`
            : project?.name || codingVal?.value != null
              ? `${codingVal?.value || ''} ${codingVal?.value != null ? 'min' : ''}`.trim() || '—'
              : '—',
      })

      // Prefill inputs only if empty, so we don't overwrite current edits
      setInputs((prev) => ({
        weight: {
          ...prev.weight,
          value: prev.weight.value || (weightVal?.value != null ? String(weightVal.value) : ''),
        },
        steps: {
          ...prev.steps,
          value:
            prev.steps.value ||
            (stepsTodayVal?.value != null
              ? String(stepsTodayVal.value)
              : stepsLatestVal?.value != null
                ? String(stepsLatestVal.value)
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
          type: prev.workout.type || (workoutVal?.type as string) || '',
          duration:
            prev.workout.duration ||
            (workoutVal?.duration_min != null ? String(workoutVal.duration_min) : ''),
        },
        code: {
          ...prev.code,
          minutes:
            prev.code.minutes || (codingVal?.value != null ? String(codingVal.value) : ''),
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
        const { error } = await upsertCheckin(supabase, {
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
        const { error } = await upsertCheckin(supabase, {
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
        const { error: mealError } = await insertMeal(supabase, {
          user_id: user.id,
          consumed_at: new Date().toISOString(),
          name,
          calories,
          notes: inputs.food.notes || null,
        })
        if (mealError) throw mealError

        const { error: caloriesError } = await upsertCheckin(supabase, {
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
        const { error } = await upsertCheckin(supabase, {
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
        const { error } = await upsertCheckin(supabase, {
          user_id: user.id,
          date: today,
          type: checkinTypeForTile('code') ?? 'coding_minutes',
          value_json: { value, project },
          notes: inputs.code.notes || null,
        })
        if (error) throw error
      }

      toast('Saved', 'success')
      setActiveTile(null)
      void loadData()
    } catch (error: unknown) {
      console.error('Error saving check-in:', error)
      const message = error instanceof Error ? error.message : 'Failed to save. Please try again.'
      toast(message || 'Failed to save. Please try again.', 'error')
    } finally {
      setSavingTile(null)
    }
  }

  const recentActivity = useMemo(
    () =>
      checkins.slice(0, 15).map((c) => {
        const relative = dayRelativeLabel(c.date, timeZone)
        return {
          ...c,
          displayDate: relative || format(new Date(`${c.date}T12:00:00`), 'MMM d'),
        }
      }),
    [checkins, timeZone]
  )

  const todayTypes = useMemo(() => todayTypesFromCheckins(checkins, today), [checkins, today])

  const focusTiles = focusTileIds() as CheckinTileId[]
  const doneToday = focusTiles.filter((t) => isTileDone(t, todayTypes)).length
  const focusPct = focusTiles.length
    ? Math.round((doneToday / focusTiles.length) * 100)
    : 0

  const streak = useMemo(() => {
    const streakType = streakTracker()?.checkinType ?? 'weight'
    const dates = checkins.filter((c) => c.type === streakType).map((c) => c.date)
    return calculateDailyStreak(dates, today)
  }, [checkins, today])

  return {
    today,
    timeZone,
    loading,
    savingTile,
    activeTile,
    setActiveTile,
    displayName,
    units,
    weightLabel,
    suggestions,
    inputs,
    setInputs,
    lastValues,
    loadData,
    handleQuickSubmit,
    todayTypes,
    focusTiles,
    doneToday,
    focusPct,
    streak,
    recentActivity,
    tileMeta: (id: TileType) => tileMetaFor(id, units),
    isTileDone: (tile: TileType) => isTileDone(tile, todayTypes),
  }
}

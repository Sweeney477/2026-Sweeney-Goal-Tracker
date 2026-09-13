'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { localDateTimeValue, localDayKey, resolveTimezone } from '@/lib/dates'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import {
  createMealPhotoSignedUrl,
  deleteMeal as deleteMealApi,
  getCalorieGoal,
  insertMeal,
  listRecentMeals,
  removeMealPhotos,
  updateMeal,
  uploadMealPhoto,
  type MealWithUrl,
} from '@/lib/meals/api'

const defaultDateTime = (tz?: string) => localDateTimeValue(resolveTimezone(tz))
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const MEALS_PER_PAGE = 10

export function useMeals() {
  const supabase = createClient()
  const signedUrlCache = useRef(new Map<string, { url: string; expiresAt: number }>())

  const [meals, setMeals] = useState<MealWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [consumedAt, setConsumedAt] = useState(defaultDateTime())
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [estimate, setEstimate] = useState<Record<string, unknown> | null>(null)
  const [editingMeal, setEditingMeal] = useState<MealWithUrl | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<string | null>(null)
  const [calorieGoal, setCalorieGoal] = useState(2200)
  const [timeZone, setTimeZone] = useState(() => resolveTimezone())

  useEffect(() => {
    loadMeals(1, false)
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await getCalorieGoal(supabase, user.id)

        if (data?.calorie_goal) {
          setCalorieGoal(data.calorie_goal)
        }
        const { data: profile } = await supabase.from('profiles').select('timezone').eq('user_id', user.id).maybeSingle()
        const tz = resolveTimezone(profile?.timezone)
        setTimeZone(tz)
        setConsumedAt((prev) => prev || defaultDateTime(tz))
      } catch (err) {
        console.error('Error loading calorie goal:', err)
      }
    }
    loadProfile()
  }, [supabase])

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const cached = signedUrlCache.current.get(storagePath)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url
    }

    const { data: urlData } = await createMealPhotoSignedUrl(supabase, storagePath)

    if (urlData?.signedUrl) {
      signedUrlCache.current.set(storagePath, {
        url: urlData.signedUrl,
        expiresAt: Date.now() + 50 * 60 * 1000,
      })
      return urlData.signedUrl
    }

    return null
  }

  const loadMeals = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMeals([])
        setHasMore(false)
        return
      }

      const from = (pageNum - 1) * MEALS_PER_PAGE
      const to = from + MEALS_PER_PAGE - 1

      const { data, error } = await listRecentMeals(supabase, user.id, { from, to })

      if (error) throw error

      const newMeals = (data || []) as MealWithUrl[]
      setHasMore(newMeals.length === MEALS_PER_PAGE)

      const mealsWithUrls: MealWithUrl[] = await Promise.all(
        newMeals.map(async (meal) => {
          if (meal.photo_path) {
            const signedUrl = await getSignedUrl(meal.photo_path)
            return { ...meal, signedUrl }
          }
          return meal
        })
      )

      if (append) {
        setMeals((prev) => [...prev, ...mealsWithUrls])
      } else {
        setMeals(mealsWithUrls)
      }
    } catch (error) {
      console.error('Error loading meals:', error)
      if (!append) {
        setMeals([])
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    await loadMeals(nextPage, true)
  }

  const fileToDataUrl = (inputFile: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(inputFile)
    })

  const handleEstimate = async () => {
    if (!file) return
    setEstimating(true)
    try {
      const base64 = await fileToDataUrl(file)
      const res = await fetch(`${BASE_PATH}/api/ai/meal-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to estimate macros')
      }

      const { estimate: estimateResult } = await res.json()
      setEstimate(estimateResult)

      if (!calories && estimateResult?.calories) setCalories(String(estimateResult.calories))
      if (!protein && estimateResult?.protein_g) setProtein(String(estimateResult.protein_g))
      if (!carbs && estimateResult?.carbs_g) setCarbs(String(estimateResult.carbs_g))
      if (!fat && estimateResult?.fat_g) setFat(String(estimateResult.fat_g))
      if (!notes && estimateResult?.notes) setNotes(estimateResult.notes)
    } catch (error: any) {
      console.error('Error estimating meal:', error)
      toast(error.message || 'Could not estimate macros. Please try again.', 'error')
    } finally {
      setEstimating(false)
    }
  }

  const resetForm = () => {
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setNotes('')
    setFile(null)
    setEstimate(null)
    setConsumedAt(defaultDateTime())
    setEditingMeal(null)
  }

  const startEdit = (meal: MealWithUrl) => {
    setEditingMeal(meal)
    setName(meal.name || '')
    setCalories(meal.calories ? String(meal.calories) : '')
    setProtein(meal.protein_g ? String(meal.protein_g) : '')
    setCarbs(meal.carbs_g ? String(meal.carbs_g) : '')
    setFat(meal.fat_g ? String(meal.fat_g) : '')
    setNotes(meal.notes || '')
    setConsumedAt(format(new Date(meal.consumed_at), "yyyy-MM-dd'T'HH:mm"))
    setFile(null)
    setEstimate(meal.ai_estimate || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const toNumber = (value: string) => (value ? Number(value) : null)

      let photoPath: string | null = editingMeal?.photo_path || null
      if (file) {
        if (editingMeal?.photo_path) {
          await removeMealPhotos(supabase, [editingMeal.photo_path])
        }
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await uploadMealPhoto(supabase, path, file)
        if (uploadError) throw uploadError
        photoPath = path
      }

      const consumedAtIso = consumedAt
        ? new Date(consumedAt).toISOString()
        : new Date().toISOString()

      const payload = {
        consumed_at: consumedAtIso,
        name: name || null,
        calories: toNumber(calories),
        protein_g: toNumber(protein),
        carbs_g: toNumber(carbs),
        fat_g: toNumber(fat),
        notes: notes || null,
        photo_path: photoPath,
        ai_estimate: estimate || null,
      }

      if (editingMeal) {
        const { error } = await updateMeal(supabase, editingMeal.id, user.id, payload)
        if (error) throw error
        toast('Meal updated!', 'success')
      } else {
        const { error } = await insertMeal(supabase, {
          user_id: user.id,
          ...payload,
        })
        if (error) throw error
        toast('Meal logged!', 'success')
      }

      resetForm()
      setPage(1)
      await loadMeals(1, false)
    } catch (error: any) {
      console.error('Error saving meal:', error)
      toast(error.message || 'Failed to save meal. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return

    setDeletingMeal(mealId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const meal = meals.find((m) => m.id === mealId)

      if (meal?.photo_path) {
        await removeMealPhotos(supabase, [meal.photo_path])
      }

      const { error } = await deleteMealApi(supabase, user.id, mealId)

      if (error) throw error
      toast('Meal deleted', 'success')
      loadMeals(page, false)
    } catch (error: any) {
      console.error('Error deleting meal:', error)
      toast(error.message || 'Failed to delete meal.', 'error')
    } finally {
      setDeletingMeal(null)
    }
  }

  const todayKey = localDayKey(timeZone)
  const caloriesToday = meals
    .filter((m) => localDayKey(timeZone, new Date(m.consumed_at)) === todayKey)
    .reduce((sum, m) => sum + (m.calories || 0), 0)
  const remaining = Math.max(0, calorieGoal - caloriesToday)
  const eatenPct = Math.max(0, Math.min(100, Math.round((caloriesToday / calorieGoal) * 100)))

  return {
    meals,
    loading,
    loadingMore,
    submitting,
    estimating,
    hasMore,
    calorieGoal,
    timeZone,
    caloriesToday,
    remaining,
    eatenPct,
    consumedAt,
    setConsumedAt,
    name,
    setName,
    calories,
    setCalories,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    notes,
    setNotes,
    file,
    setFile,
    estimate,
    editingMeal,
    deletingMeal,
    loadMore,
    handleEstimate,
    resetForm,
    startEdit,
    handleSubmit,
    handleDelete,
  }
}

'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Meal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Flame, ScanLine, Plus, ChevronRight, Edit2, Trash2, X, Save } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { listRecentMeals, deleteMeal as deleteMealApi } from '@/lib/meals/api'

type MealWithUrl = Meal & { signedUrl?: string | null }

const defaultDateTime = () => format(new Date(), "yyyy-MM-dd'T'HH:mm")
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function MealsPage() {
  const supabase = createClient()
  const [meals, setMeals] = useState<MealWithUrl[]>([])
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const MEALS_PER_PAGE = 10
  const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

  const [consumedAt, setConsumedAt] = useState(defaultDateTime())
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [estimate, setEstimate] = useState<Record<string, any> | null>(null)
  const [editingMeal, setEditingMeal] = useState<MealWithUrl | null>(null)
  const [deletingMeal, setDeletingMeal] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMeals(1, false)
  }, [])

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    // Check cache first
    const cached = signedUrlCache.get(storagePath)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url
    }

    // Generate new signed URL
    const { data: urlData } = await supabase.storage
      .from('meal-photos')
      .createSignedUrl(storagePath, 3600)

    if (urlData?.signedUrl) {
      // Cache for 50 minutes
      signedUrlCache.set(storagePath, {
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

      if (!user) return

      const from = (pageNum - 1) * MEALS_PER_PAGE
      const to = from + MEALS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const newMeals = (data || []) as Meal[]
      setHasMore(newMeals.length === MEALS_PER_PAGE)

      if (append) {
        setAllMeals((prev) => [...prev, ...newMeals])
      } else {
        setAllMeals(newMeals)
      }

      // Only generate signed URLs for meals with photos
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
    // Scroll to form
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
        // Delete old photo if editing and has new photo
        if (editingMeal?.photo_path) {
          await supabase.storage.from('meal-photos').remove([editingMeal.photo_path])
        }
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, file)
        if (uploadError) throw uploadError
        photoPath = path
      }

      const consumedAtIso = consumedAt
        ? new Date(consumedAt).toISOString()
        : new Date().toISOString()

      if (editingMeal) {
        // Update existing meal
        const { error } = await supabase
          .from('meals')
          .update({
            consumed_at: consumedAtIso,
            name: name || null,
            calories: toNumber(calories),
            protein_g: toNumber(protein),
            carbs_g: toNumber(carbs),
            fat_g: toNumber(fat),
            notes: notes || null,
            photo_path: photoPath,
            ai_estimate: estimate || null,
          })
          .eq('id', editingMeal.id)

        if (error) throw error
        toast('Meal updated!', 'success')
      } else {
        // Create new meal
        const { error } = await supabase.from('meals').insert({
          user_id: user.id,
          consumed_at: consumedAtIso,
          name: name || null,
          calories: toNumber(calories),
          protein_g: toNumber(protein),
          carbs_g: toNumber(carbs),
          fat_g: toNumber(fat),
          notes: notes || null,
          photo_path: photoPath,
          ai_estimate: estimate || null,
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
      const meal = meals.find((m) => m.id === mealId)
      
      // Delete photo if exists
      if (meal?.photo_path) {
        await supabase.storage.from('meal-photos').remove([meal.photo_path])
      }

      const { error } = await supabase.from('meals').delete().eq('id', mealId)

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

  const [calorieGoal, setCalorieGoal] = useState(2200)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('profiles')
          .select('calorie_goal')
          .eq('user_id', user.id)
          .single()

        if (data?.calorie_goal) {
          setCalorieGoal(data.calorie_goal)
        }
      } catch (err) {
        console.error('Error loading calorie goal:', err)
      }
    }
    loadProfile()
  }, [supabase])

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const caloriesToday = meals
    .filter((m) => format(new Date(m.consumed_at), 'yyyy-MM-dd') === todayKey)
    .reduce((sum, m) => sum + (m.calories || 0), 0)
  const remaining = Math.max(0, calorieGoal - caloriesToday)
  const eatenPct = Math.max(0, Math.min(100, Math.round((caloriesToday / calorieGoal) * 100)))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Meals</h1>
        </div>
        <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4" /> {format(new Date(), 'd MMM')} 
          </span>
        </div>
      </div>

      {/* Calories hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-sm">
        <div className="text-sm opacity-90">Calories Remaining</div>
        <div className="mt-1 text-5xl font-semibold">{remaining}</div>
        <div className="mt-2 flex items-center justify-between text-sm opacity-90">
          <div>{caloriesToday.toLocaleString()} Eaten</div>
          <div>Goal: {calorieGoal.toLocaleString()}</div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${eatenPct}%` }} />
        </div>
        <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
          <div className="h-6 w-6 rounded-full border border-white/40" />
        </div>
      </div>

      {/* Quick log */}
      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">{editingMeal ? 'Edit Meal' : 'Quick Log'}</div>
            {editingMeal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="h-7 rounded-xl"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
          {!editingMeal && (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
              onClick={() => toast('Scanner coming soon — for now upload a photo for AI estimates.', 'info')}
            >
              <ScanLine className="h-4 w-4" />
              Scanner
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            placeholder="What did you eat?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-2xl"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Kcal"
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="h-12 rounded-2xl"
            />
            <Input
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              className="h-12 rounded-2xl"
              required
            />
          </div>

          <details className="rounded-2xl border bg-muted/20 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
              More details
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="text-xs font-semibold text-muted-foreground">
                    Protein (g)
                  </Label>
                  <Input
                    id="protein"
                    type="number"
                    inputMode="numeric"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs" className="text-xs font-semibold text-muted-foreground">
                    Carbs (g)
                  </Label>
                  <Input
                    id="carbs"
                    type="number"
                    inputMode="numeric"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat" className="text-xs font-semibold text-muted-foreground">
                    Fat (g)
                  </Label>
                  <Input
                    id="fat"
                    type="number"
                    inputMode="numeric"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-xs font-semibold text-muted-foreground">
                  Photo (optional)
                </Label>
                {editingMeal?.signedUrl && !file && (
                  <div className="relative mb-2">
                    <img
                      src={editingMeal.signedUrl}
                      alt="Current meal photo"
                      className="h-32 w-full rounded-2xl object-cover"
                    />
                    <div className="absolute right-2 top-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-lg">
                      Current photo
                    </div>
                  </div>
                )}
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="h-12 rounded-2xl"
                />
                {file && (
                  <div className="text-xs text-muted-foreground">
                    New photo selected: {file.name}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={!file || estimating}
                    onClick={handleEstimate}
                  >
                    {estimating ? 'Estimating…' : 'Estimate from photo'}
                  </Button>
                  {estimate && (
                    <span className="text-sm text-muted-foreground">
                      AI estimate ready — you can edit before saving
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">
                  Notes (optional)
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context or adjustments..."
                  className="flex min-h-[90px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </details>

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-950/90"
          >
            {editingMeal ? (
              <>
                <Save className="mr-2 h-5 w-5" />
                {submitting ? 'Updating…' : 'Update Meal'}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                {submitting ? 'Saving…' : 'Log Meal'}
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Recent meals */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Recent Meals</div>
          <button type="button" className="text-sm font-medium text-muted-foreground">
            View All
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : meals.length === 0 ? (
            <div className="rounded-3xl border bg-background p-5 text-center text-sm text-muted-foreground">
              No meals logged yet.
            </div>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="group overflow-hidden rounded-3xl border bg-background shadow-sm">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="flex-1">
                    <div className="text-base font-semibold">{meal.name || 'Meal'}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(meal.consumed_at), 'MMM d • h:mma')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {meal.calories != null ? (
                        <div className="text-sm font-semibold">
                          {meal.calories} <span className="text-xs text-muted-foreground">KCAL</span>
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        {[meal.protein_g ? `${meal.protein_g}P` : null, meal.carbs_g ? `${meal.carbs_g}C` : null, meal.fat_g ? `${meal.fat_g}F` : null]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => startEdit(meal)}
                        title="Edit meal"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(meal.id)}
                        disabled={deletingMeal === meal.id}
                        title="Delete meal"
                      >
                        {deletingMeal === meal.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                {meal.notes && <div className="px-4 pb-3 text-sm text-muted-foreground">{meal.notes}</div>}
                {meal.signedUrl && (
                  <img
                    src={meal.signedUrl}
                    alt={meal.name || 'Meal photo'}
                    className="h-44 w-full object-cover"
                  />
                )}
              </div>
            ))
          )}

          {hasMore && (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
              className="mt-4 w-full rounded-2xl"
            >
              {loadingMore ? 'Loading...' : 'Load More Meals'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}



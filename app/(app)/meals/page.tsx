'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Meal } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type MealWithUrl = Meal & { signedUrl?: string | null }

const defaultDateTime = () => format(new Date(), "yyyy-MM-dd'T'HH:mm")

export default function MealsPage() {
  const supabase = createClient()
  const [meals, setMeals] = useState<MealWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [estimating, setEstimating] = useState(false)

  const [consumedAt, setConsumedAt] = useState(defaultDateTime())
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [estimate, setEstimate] = useState<Record<string, any> | null>(null)

  const loadMeals = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: false })
        .limit(25)

      if (error) throw error

      const mealsWithUrls: MealWithUrl[] = await Promise.all(
        (data || []).map(async (meal) => {
          if (meal.photo_path) {
            const { data: urlData } = await supabase.storage
              .from('meal-photos')
              .createSignedUrl(meal.photo_path, 3600)
            return { ...meal, signedUrl: urlData?.signedUrl || null }
          }
          return meal
        })
      )

      setMeals(mealsWithUrls)
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadMeals()
  }, [loadMeals])

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
      const res = await fetch('/api/ai/meal-estimate', {
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
    } catch (error) {
      console.error('Error estimating meal:', error)
      alert('Could not estimate macros. Please try again.')
    } finally {
      setEstimating(false)
    }
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

      let photoPath: string | null = null
      if (file) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, file)
        if (uploadError) throw uploadError
        photoPath = path
      }

      const consumedAtIso = consumedAt
        ? new Date(consumedAt).toISOString()
        : new Date().toISOString()

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

      setName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      setNotes('')
      setFile(null)
      setEstimate(null)
      setConsumedAt(defaultDateTime())
      loadMeals()
    } catch (error) {
      console.error('Error saving meal:', error)
      alert('Failed to save meal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meals</h1>
          <p className="text-muted-foreground mt-1">
            Quick log with manual macros, plus optional photo estimates
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Meal Log</CardTitle>
            <CardDescription>Enter calories/macros and attach a photo if you want an AI estimate</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consumedAt">Date &amp; Time</Label>
                  <Input
                    id="consumedAt"
                    type="datetime-local"
                    value={consumedAt}
                    onChange={(e) => setConsumedAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Meal Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Chicken bowl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    inputMode="numeric"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="kcal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    inputMode="numeric"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="grams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    inputMode="numeric"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="grams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    inputMode="numeric"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="grams"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Photo (optional)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!file || estimating}
                    onClick={handleEstimate}
                  >
                    {estimating ? 'Estimating…' : 'Estimate from photo'}
                  </Button>
                  {estimate && (
                    <span className="text-sm text-muted-foreground self-center">
                      AI estimate ready — you can edit before saving
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context or adjustments..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Meal'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
            <CardDescription>Your latest entries</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : meals.length === 0 ? (
              <div className="text-muted-foreground">No meals logged yet</div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-medium">
                          {meal.name || 'Meal'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(meal.consumed_at), 'MMM d, yyyy h:mma')}
                        </div>
                      </div>
                      {(meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g) && (
                        <div className="text-right text-sm">
                          {meal.calories ? <div>{meal.calories} kcal</div> : null}
                          <div className="text-muted-foreground">
                            {[meal.protein_g ? `${meal.protein_g}P` : null, meal.carbs_g ? `${meal.carbs_g}C` : null, meal.fat_g ? `${meal.fat_g}F` : null]
                              .filter(Boolean)
                              .join(' / ')}
                          </div>
                        </div>
                      )}
                    </div>
                    {meal.notes && (
                      <div className="text-sm text-muted-foreground">{meal.notes}</div>
                    )}
                    {meal.signedUrl && (
                      <Image
                        src={meal.signedUrl}
                        alt={meal.name || 'Meal photo'}
                        width={1200}
                        height={600}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    )}
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




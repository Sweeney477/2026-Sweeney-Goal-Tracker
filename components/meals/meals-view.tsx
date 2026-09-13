'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScanLine, Plus, ChevronRight, Edit2, Trash2, X, Save } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { useMeals } from '@/lib/meals/use-meals'
import { DayContext } from '@/components/day-context'
import { LoadingState } from '@/components/loading-state'

export function MealsView() {
  const {
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
  } = useMeals()

  if (loading) {
    return <LoadingState label="Loading meals" variant="form" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Meals</h1>
          <DayContext timeZone={timeZone} className="mt-1" />
        </div>
      </div>

      {/* Calories summary */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-brand p-5 text-brand-foreground shadow-soft">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-foreground/75">
          Calories remaining today
        </div>
        <div className="relative mt-1 font-display text-4xl font-semibold tracking-tight">{remaining}</div>
        <div className="relative mt-2 flex items-center justify-between text-sm text-brand-foreground/85">
          <div>{caloriesToday.toLocaleString()} eaten</div>
          <div>Goal {calorieGoal.toLocaleString()}</div>
        </div>
        <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${eatenPct}%` }} />
        </div>
      </div>

      {/* Quick log */}
      <div className="soft-card p-5">
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
              className="inline-flex items-center gap-2 text-sm font-medium text-brand"
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

          <details className="rounded-2xl bg-muted/40 p-3">
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
            className="h-11 w-full rounded-xl"
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
            <div className="soft-card p-5 text-center text-sm text-muted-foreground">
              No meals logged yet.
            </div>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="soft-card group overflow-hidden">
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

          {!loading && meals.length > 0 && hasMore ? (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
              className="mt-4 w-full rounded-2xl"
            >
              {loadingMore ? 'Loading...' : 'Load More Meals'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

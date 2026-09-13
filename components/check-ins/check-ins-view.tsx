'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { LoadingState } from '@/components/loading-state'
import { DayContext } from '@/components/day-context'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { useCheckins } from '@/lib/checkins/use-checkins'

export function CheckInsView() {
  const {
    loading,
    savingTile,
    activeTile,
    setActiveTile,
    displayName,
    weightLabel,
    suggestions,
    inputs,
    setInputs,
    lastValues,
    handleQuickSubmit,
    focusTiles,
    doneToday,
    focusPct,
    streak,
    recentActivity,
    tileMeta,
    isTileDone,
    timeZone,
  } = useCheckins()

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
          <Button className="rounded-xl" onClick={() => void handleQuickSubmit(activeTile)} disabled={savingTile === activeTile}>
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
          <Button className="rounded-xl" onClick={() => void handleQuickSubmit('food')} disabled={savingTile === 'food'}>
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
          <Button className="rounded-xl" onClick={() => void handleQuickSubmit('workout')} disabled={savingTile === 'workout'}>
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
              placeholder="What did you work on?"
            />
          </div>
          <Button className="rounded-xl" onClick={() => void handleQuickSubmit('code')} disabled={savingTile === 'code'}>
            {savingTile === 'code' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return <LoadingState label="Loading check-ins" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Log"
        title={displayName ? `Hello, ${displayName}` : 'Daily log'}
        description="Record today’s metrics. Values save to your local day."
        action={
          streak > 0 ? (
            <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              {streak}-day streak
            </div>
          ) : null
        }
      />
      <DayContext timeZone={timeZone} showZone className="-mt-4" />

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Progress
            </div>
            <div className="mt-1 font-display text-xl font-semibold tracking-tight">
              {doneToday} of {focusTiles.length} logged
            </div>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Finish the checklist when you can — incomplete days stay visible in history.
            </p>
          </div>
          <div
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-brand/30 text-sm font-semibold text-brand"
            aria-label={`${focusPct} percent complete`}
          >
            {focusPct}%
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${focusPct}%` }} />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Today&apos;s metrics
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {focusTiles.map((tile) => {
            const meta = tileMeta(tile)
            const isDone = isTileDone(tile)
            return (
              <button
                key={tile}
                type="button"
                onClick={() => setActiveTile(tile)}
                className={cn(
                  'rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted/40',
                  activeTile === tile && 'border-brand/40 ring-2 ring-brand/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{meta.label}</div>
                  <div
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full border text-[10px]',
                      isDone
                        ? 'border-brand bg-brand text-brand-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : null}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{lastValues[tile] || '—'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {activeTile && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Log {tileMeta(activeTile).label}</div>
          {renderForm()}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Recent activity
        </div>
        <div className="mt-3 rounded-2xl border bg-card p-4">
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No check-ins yet"
              description="Log a metric above to start your history."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((checkin) => (
                <div key={checkin.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold capitalize">
                      {checkin.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">{checkin.displayDate}</div>
                    {checkin.notes ? (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{checkin.notes}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">
                    {checkin.value_json?.value || checkin.value_json?.type || '—'}{' '}
                    {checkin.type === 'weight' && weightLabel}
                    {checkin.type === 'steps' && 'steps'}
                    {checkin.type === 'calories' && 'cal'}
                    {checkin.type === 'coding_minutes' && 'min'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

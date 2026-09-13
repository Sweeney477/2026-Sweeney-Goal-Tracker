'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Code2, Dumbbell, Flame, Footprints, Scale } from 'lucide-react'
import { LoadingState } from '@/components/loading-state'
import { DayContext } from '@/components/day-context'
import { EmptyState } from '@/components/empty-state'
import { SoftCard, ActivityCard, toneFromPastel } from '@/components/soft-ui'
import type { SoftPastel } from '@/lib/config/trackers'
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
          <Button className="rounded-full" onClick={() => void handleQuickSubmit(activeTile)} disabled={savingTile === activeTile}>
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
          <Button className="rounded-full" onClick={() => void handleQuickSubmit('food')} disabled={savingTile === 'food'}>
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
          <Button className="rounded-full" onClick={() => void handleQuickSubmit('workout')} disabled={savingTile === 'workout'}>
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
          <Button className="rounded-full" onClick={() => void handleQuickSubmit('code')} disabled={savingTile === 'code'}>
            {savingTile === 'code' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )
    }

    return null
  }

  const tileIcon = (tile: (typeof focusTiles)[number]) => {
    const props = { className: 'h-4 w-4', strokeWidth: 1.75 as const }
    switch (tile) {
      case 'weight':
        return <Scale {...props} />
      case 'steps':
        return <Footprints {...props} />
      case 'food':
        return <Flame {...props} />
      case 'workout':
        return <Dumbbell {...props} />
      case 'code':
        return <Code2 {...props} />
      default:
        return <Scale {...props} />
    }
  }

  if (loading) {
    return <LoadingState label="Loading check-ins" />
  }

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Log</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            {displayName ? `Hello, ${displayName}` : 'Daily log'}
          </h1>
          <DayContext timeZone={timeZone} showZone className="mt-1.5" />
        </div>
        {streak > 0 ? (
          <div className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
            {streak}-day streak
          </div>
        ) : null}
      </div>

      <SoftCard tone="brand" className="relative overflow-hidden p-5 md:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-foreground/75">
              Today&apos;s progress
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-foreground md:text-3xl">
              {doneToday} of {focusTiles.length} logged
            </div>
            <p className="mt-2 max-w-sm text-sm text-brand-foreground/80">
              Finish the checklist when you can — incomplete days stay visible in history.
            </p>
          </div>
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold text-brand-foreground"
            aria-label={`${focusPct} percent complete`}
          >
            {focusPct}%
          </div>
        </div>
        <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${focusPct}%` }} />
        </div>
      </SoftCard>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Today&apos;s metrics</h2>
          <span className="text-xs text-muted-foreground">Tap a card to log</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {focusTiles.map((tile) => {
            const meta = tileMeta(tile)
            const isDone = isTileDone(tile)
            const tone = toneFromPastel((meta.accent || 'pastel-mint') as SoftPastel)
            const isActive = activeTile === tile
            return (
              <ActivityCard
                key={tile}
                onClick={() => setActiveTile(tile)}
                category={meta.label}
                title={isDone ? 'Logged' : meta.helper}
                value={lastValues[tile] || '—'}
                icon={tileIcon(tile)}
                tone={isActive ? 'brand' : tone}
                done={isDone}
                className={isActive ? 'ring-2 ring-brand/30' : undefined}
              />
            )
          })}
        </div>
      </div>

      {activeTile ? (
        <SoftCard className="p-5">
          <div className="mb-4 font-display text-lg font-semibold tracking-tight">
            Log {tileMeta(activeTile).label}
          </div>
          {renderForm()}
        </SoftCard>
      ) : null}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">Recent activity</h2>
        <SoftCard className="p-5">
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No check-ins yet"
              description="Log a metric above to start your history."
              className="bg-transparent py-6"
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold capitalize">
                      {checkin.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">{checkin.displayDate}</div>
                    {checkin.notes ? (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{checkin.notes}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right font-display text-base font-semibold tabular-nums">
                    {checkin.value_json?.value || checkin.value_json?.type || '—'}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      {checkin.type === 'weight' && weightLabel}
                      {checkin.type === 'steps' && 'steps'}
                      {checkin.type === 'calories' && 'cal'}
                      {checkin.type === 'coding_minutes' && 'min'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SoftCard>
      </div>
    </div>
  )
}

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


  const complete = focusTiles.length > 0 && doneToday === focusTiles.length
  const nextTile = focusTiles.find((t) => !isTileDone(t)) || focusTiles[0] || null
  const nextMeta = nextTile ? tileMeta(nextTile) : null
  const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0')

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="space-y-5">
        <div>
          <h1 className="font-display text-[1.85rem] font-semibold tracking-tight md:text-4xl">
            {displayName ? `Hello, ${displayName}` : 'Daily log'}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">Today&apos;s summary</p>
          <DayContext timeZone={timeZone} showZone className="mt-1.5" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                {pad2(doneToday)}
              </span>
              <span className="font-display text-3xl font-medium text-foreground/25 md:text-4xl">/</span>
              <span className="font-display text-3xl font-medium text-foreground/30 md:text-4xl">
                {pad2(focusTiles.length)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tot activities logged</p>
          </div>
          {streak > 0 ? (
            <div className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
              {streak}-day streak
            </div>
          ) : null}
        </div>
      </section>

      <SoftCard className="p-0">
        <div className="relative overflow-hidden px-5 pb-4 pt-5 md:px-6 md:pt-6">
          <div
            className="pointer-events-none absolute -right-4 top-0 h-36 w-36 rounded-full opacity-90 blur-2xl"
            style={{
              background:
                'radial-gradient(circle at 40% 40%, hsl(265 70% 78% / 0.55), transparent 62%), radial-gradient(circle at 70% 70%, hsl(22 90% 72% / 0.45), transparent 58%)',
            }}
            aria-hidden
          />
          <div className="relative max-w-[80%]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {complete ? 'Today' : 'Focus'}
            </div>
            <div className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
              {complete
                ? 'Log looks complete'
                : nextMeta
                  ? `Log ${nextMeta.label.toLowerCase()}`
                  : 'Start today’s log'}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {complete
                ? 'All leading metrics are in. Tap a card below to update any value.'
                : nextMeta?.helper || 'Capture the next leading metric for your local day.'}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Progress{' '}
              <strong className="font-semibold text-foreground">
                {doneToday}/{focusTiles.length}
              </strong>
              <span className="mx-2 text-foreground/35">·</span>
              {focusPct}%
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => nextTile && setActiveTile(nextTile)}
          className="relative flex w-full items-center justify-between gap-3 border-t border-border/50 px-5 py-3.5 text-sm font-semibold text-brand transition-colors hover:bg-muted/30 md:px-6"
        >
          <span>
            {complete
              ? 'Review metrics'
              : nextMeta
                ? `Log ${nextMeta.label}`
                : 'Open a metric'}
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10">→</span>
        </button>
      </SoftCard>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Today&apos;s metrics</h2>
          <span className="text-xs text-muted-foreground">Tap a card to log</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
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
                className={isActive ? 'ring-2 ring-brand/25' : undefined}
              />
            )
          })}
        </div>
      </section>

      {activeTile ? (
        <SoftCard className="p-5">
          <div className="mb-4 font-display text-lg font-semibold tracking-tight">
            Log {tileMeta(activeTile).label}
          </div>
          {renderForm()}
        </SoftCard>
      ) : null}

      <section>
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
      </section>
    </div>
  )
}

'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Flame, Sparkles, ChevronRight } from 'lucide-react'
import { LoadingState } from '@/components/loading-state'
import { useCheckins } from '@/lib/checkins/use-checkins'

function ProgressRing({ value }: { value: number }) {
  return (
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
}

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
          const meta = tileMeta(tile)
          const isDone = isTileDone(tile)
          return (
            <button
              key={tile}
              onClick={() => setActiveTile(tile)}
              className={cn(
                'relative overflow-hidden rounded-3xl border bg-background p-4 text-left shadow-sm',
                activeTile === tile ? 'border-blue-600/40 ring-2 ring-blue-600/20' : ''
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', meta.accent)} />
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
                <div className="mt-4 text-sm font-semibold">{meta.label}</div>
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
          <div className="text-sm font-semibold">{tileMeta('food').label}</div>
          <div className="text-xs text-muted-foreground">{lastValues.food || 'Quick log a meal'}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {activeTile && (
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold">Quick log: {tileMeta(activeTile).label}</div>
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

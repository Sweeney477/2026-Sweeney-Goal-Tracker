'use client'

import { format } from 'date-fns'
import { WorkoutVolume } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useWorkouts } from '@/lib/workouts/use-workouts'
import type { EditableExercise } from '@/lib/workouts/types'

export function WorkoutsView() {
  const {
    date,
    selectDate,
    workoutTitle,
    setWorkoutTitle,
    duration,
    setDuration,
    exercises,
    workoutId,
    loadingBuilder,
    saving,
    recentWorkouts,
    pickerOpen,
    setPickerOpen,
    searchTerm,
    setSearchTerm,
    libraryResults,
    libraryFavorites,
    libraryRecents,
    libraryLoading,
    addExerciseFromLibrary,
    addCustomExerciseFromSearch,
    updateExerciseField,
    updateSetField,
    addSet,
    copyLastSet,
    removeExercise,
    toggleFavorite,
    handleSave,
    resetSession,
  } = useWorkouts()

  const renderExerciseCard = (exercise: EditableExercise, exerciseIndex: number) => (
    <div key={`${exercise.name}-${exerciseIndex}`} className="rounded-3xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-sm font-semibold text-brand"
              aria-hidden
            >
              {exerciseIndex + 1}
            </div>
            <div className="min-w-0">
              <Input
                value={exercise.name}
                onChange={(e) => updateExerciseField(exerciseIndex, 'name', e.target.value)}
                placeholder="Exercise name"
                className="h-auto border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="mt-1 flex flex-wrap gap-2">
                {exercise.liftType ? (
                  <Badge variant="secondary" className="rounded-full">
                    {exercise.liftType}
                  </Badge>
                ) : null}
                {exercise.equipment ? (
                  <Badge variant="secondary" className="rounded-full">
                    {exercise.equipment}
                  </Badge>
                ) : null}
                {exercise.libraryId ? (
                  <Badge variant="secondary" className="rounded-full">
                    Library
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">Lift type</Label>
              <Input
                value={exercise.liftType}
                onChange={(e) => updateExerciseField(exerciseIndex, 'liftType', e.target.value)}
                placeholder="Strength"
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">Equipment</Label>
              <Input
                value={exercise.equipment}
                onChange={(e) => updateExerciseField(exerciseIndex, 'equipment', e.target.value)}
                placeholder="Barbell"
                className="h-11 rounded-2xl"
              />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl"
          onClick={() => removeExercise(exerciseIndex)}
          aria-label={`Remove ${exercise.name || 'exercise'}`}
          title="Remove exercise"
        >
          <Trash2 className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[44px_1fr_1fr_44px] gap-2 text-[11px] font-semibold text-muted-foreground">
          <div>SET</div>
          <div>WT</div>
          <div>REPS</div>
          <div className="text-center">✓</div>
        </div>
        <div className="mt-2 space-y-2">
          {exercise.sets.map((set, setIndex) => (
            <div key={setIndex} className="grid grid-cols-[44px_1fr_1fr_44px] items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {setIndex + 1}
              </div>
              <Input
                type="number"
                inputMode="decimal"
                value={set.weight}
                onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', e.target.value)}
                placeholder="kg/lb"
                className="h-10 rounded-2xl"
              />
              <Input
                type="number"
                inputMode="numeric"
                value={set.reps}
                onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', e.target.value)}
                placeholder="—"
                className="h-10 rounded-2xl"
              />
              <div className="grid place-items-center">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-brand"
                  aria-label={`Mark set ${setIndex + 1} done`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => addSet(exerciseIndex)}>
            + Add set
          </Button>
          <Button
            variant="ghost"
            className="rounded-2xl"
            disabled={exercise.sets.length === 0}
            onClick={() => copyLastSet(exerciseIndex)}
          >
            Copy last set
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">Workout Builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">Design your session for today.</p>
      </div>

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground">
              WORKOUT NAME
            </Label>
            <Input
              id="title"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              placeholder="e.g., Upper Body Power"
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">
                DATE
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  selectDate(e.target.value)
                }}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-xs font-semibold text-muted-foreground">
                DURATION (MIN)
              </Label>
              <Input
                id="duration"
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Exercises</div>
        <Button variant="outline" className="rounded-2xl" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Exercise
        </Button>
      </div>

      {loadingBuilder ? (
        <div className="text-sm text-muted-foreground">Loading session…</div>
      ) : exercises.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground shadow-sm">
          No exercises yet. Tap &ldquo;Add Exercise&rdquo; to start building.
        </div>
      ) : (
        <div className="space-y-3">{exercises.map((exercise, index) => renderExerciseCard(exercise, index))}</div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-2xl"
          onClick={resetSession}
        >
          Reset
        </Button>
        <Button
          className="h-12 flex-[2] rounded-2xl bg-blue-600 text-white hover:bg-blue-600/90"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : workoutId ? 'Update workout' : 'Save Workout'}
        </Button>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Recent History</div>
          <button type="button" className="text-sm font-medium text-muted-foreground">
            View All
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {recentWorkouts.length === 0 ? (
            <div className="rounded-3xl border bg-background p-5 text-center text-sm text-muted-foreground shadow-sm">
              No workouts logged yet.
            </div>
          ) : (
            recentWorkouts.map((workout) => {
              const volume = (workout.volume_json as WorkoutVolume | null) || null
              const exerciseCount = volume?.exercises?.length || 0
              return (
                <div key={workout.id} className="rounded-3xl border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{workout.workout_type}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(workout.date), 'MMM d, yyyy')}</div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{exerciseCount > 0 ? `${exerciseCount} exercises` : 'No volume logged'}</div>
                      {workout.duration_min ? <div>{workout.duration_min} min</div> : null}
                    </div>
                  </div>
                  {workout.notes ? (
                    <div className="mt-2 text-sm text-muted-foreground">{workout.notes}</div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-lg border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <div className="text-lg font-semibold">Add exercise</div>
                <p className="text-sm text-muted-foreground">
                  Search your library, favorites, or recents.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
                Close
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercise name"
              />

              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {libraryLoading ? (
                  <div className="text-muted-foreground text-sm">Loading exercises…</div>
                ) : searchTerm ? (
                  libraryResults.length === 0 ? (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>No matches found.</div>
                      <Button size="sm" onClick={addCustomExerciseFromSearch}>
                        Use “{searchTerm}”
                      </Button>
                    </div>
                  ) : (
                    libraryResults.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[exercise.lift_type, exercise.equipment].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(exercise)}
                          >
                            {exercise.is_favorite ? 'Unfavorite' : 'Favorite'}
                          </Button>
                          <Button size="sm" onClick={() => addExerciseFromLibrary(exercise)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <>
                    {libraryFavorites.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">Favorites</div>
                        <div className="space-y-2">
                          {libraryFavorites.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div>
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {[exercise.lift_type, exercise.equipment]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(exercise)}
                                >
                                  {exercise.is_favorite ? 'Unfavorite' : 'Favorite'}
                                </Button>
                                <Button size="sm" onClick={() => addExerciseFromLibrary(exercise)}>
                                  Add
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {libraryRecents.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">Recent</div>
                        <div className="space-y-2">
                          {libraryRecents.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div>
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {[exercise.lift_type, exercise.equipment]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(exercise)}
                                >
                                  {exercise.is_favorite ? 'Unfavorite' : 'Favorite'}
                                </Button>
                                <Button size="sm" onClick={() => addExerciseFromLibrary(exercise)}>
                                  Add
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {libraryFavorites.length === 0 && libraryRecents.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No exercises saved yet. Search to add a custom name and it will be saved to
                        your library.
                      </div>
                    )}
                  </>
                )}
              </div>

              {!searchTerm && (
                <div className="text-xs text-muted-foreground">
                  Tip: type a new exercise name to add it to your library automatically when you
                  save.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

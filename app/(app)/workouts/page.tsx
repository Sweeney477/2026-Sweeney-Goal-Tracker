'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { ExerciseLibrary, Workout, WorkoutVolume } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'

type EditableSet = {
  weight: string
  reps: string
  rpe: string
  notes: string
}

type EditableExercise = {
  name: string
  liftType: string
  equipment: string
  sets: EditableSet[]
  libraryId?: string | null
}

const defaultDate = () => format(new Date(), 'yyyy-MM-dd')
const emptySet = (): EditableSet => ({ weight: '', reps: '', rpe: '', notes: '' })

const toEditableExercises = (volume?: WorkoutVolume | null): EditableExercise[] => {
  if (!volume?.exercises) return []
  return volume.exercises.map((exercise) => ({
    name: exercise.name,
    liftType: exercise.lift_type || '',
    equipment: exercise.equipment || '',
    libraryId: exercise.library_id || null,
    sets: (exercise.sets || []).map((set) => ({
      weight: set.weight != null ? String(set.weight) : '',
      reps: set.reps != null ? String(set.reps) : '',
      rpe: set.rpe != null ? String(set.rpe) : '',
      notes: set.notes || '',
    })),
  }))
}

export default function WorkoutsPage() {
  const supabase = createClient()
  const workoutRequestRef = useRef(0)
  const libraryRequestRef = useRef(0)

  const [date, setDate] = useState(defaultDate())
  const [workoutTitle, setWorkoutTitle] = useState('Workout')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<EditableExercise[]>([])
  const [workoutId, setWorkoutId] = useState<string | null>(null)

  const [loadingBuilder, setLoadingBuilder] = useState(true)
  const [saving, setSaving] = useState(false)

  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [libraryResults, setLibraryResults] = useState<ExerciseLibrary[]>([])
  const [libraryFavorites, setLibraryFavorites] = useState<ExerciseLibrary[]>([])
  const [libraryRecents, setLibraryRecents] = useState<ExerciseLibrary[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadWorkoutForDate(date)
    loadRecentWorkouts()
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadLibrary(searchTerm)
    }, 200)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const resetBuilder = () => {
    setWorkoutId(null)
    setWorkoutTitle('Workout')
    setDuration('')
    setNotes('')
    setExercises([])
  }

  const loadWorkoutForDate = async (selectedDate: string) => {
    const requestId = ++workoutRequestRef.current
    setLoadingBuilder(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || requestId !== workoutRequestRef.current) return

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (requestId !== workoutRequestRef.current) return

      if (data && data.length > 0) {
        const workout = data[0]
        setWorkoutId(workout.id)
        setWorkoutTitle(workout.workout_type || 'Workout')
        setDuration(workout.duration_min ? String(workout.duration_min) : '')
        setNotes(workout.notes || '')
        const volume = (workout.volume_json as WorkoutVolume | null) || null
        setExercises(toEditableExercises(volume))
      } else {
        resetBuilder()
        setDate(selectedDate)
      }
    } catch (error) {
      console.error('Error loading workout:', error)
    } finally {
      if (requestId === workoutRequestRef.current) {
        setLoadingBuilder(false)
      }
    }
  }

  const loadRecentWorkouts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentWorkouts(data || [])
    } catch (error) {
      console.error('Error loading recent workouts:', error)
    }
  }

  const loadLibrary = async (term: string) => {
    const requestId = ++libraryRequestRef.current
    setLibraryLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || requestId !== libraryRequestRef.current) return

      let query = supabase
        .from('exercises_library')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (term) {
        query = query.ilike('name', `%${term}%`)
      }

      const { data, error } = await query
      if (error) throw error

      if (requestId !== libraryRequestRef.current) return

      setLibraryResults(data || [])

      if (!term) {
        const favorites = (data || []).filter((item) => item.is_favorite)
        const recents = (data || [])
          .filter((item) => item.last_used_at)
          .sort((a, b) => (b.last_used_at || '').localeCompare(a.last_used_at || ''))
        setLibraryFavorites(favorites)
        setLibraryRecents(recents.slice(0, 8))
      }
    } catch (error) {
      console.error('Error loading exercise library:', error)
    } finally {
      if (requestId === libraryRequestRef.current) {
        setLibraryLoading(false)
      }
    }
  }

  const addExercise = (exercise: EditableExercise) => {
    setExercises((prev) => [...prev, exercise])
    setPickerOpen(false)
    setSearchTerm('')
  }

  const addExerciseFromLibrary = (exercise: ExerciseLibrary) => {
    addExercise({
      name: exercise.name,
      liftType: exercise.lift_type || '',
      equipment: exercise.equipment || '',
      libraryId: exercise.id,
      sets: [emptySet()],
    })
  }

  const addCustomExerciseFromSearch = () => {
    if (!searchTerm.trim()) return
    addExercise({
      name: searchTerm.trim(),
      liftType: '',
      equipment: '',
      sets: [emptySet()],
    })
  }

  const updateExerciseField = (index: number, field: keyof Omit<EditableExercise, 'sets'>, value: string) => {
    setExercises((prev) =>
      prev.map((exercise, i) =>
        i === index
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      )
    )
  }

  const updateSetField = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof EditableSet,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) =>
                sIndex === setIndex
                  ? {
                      ...set,
                      [field]: value,
                    }
                  : set
              ),
            }
          : exercise
      )
    )
  }

  const addSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, sets: [...exercise.sets, emptySet()] } : exercise
      )
    )
  }

  const copyLastSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise
        const lastSet = exercise.sets[exercise.sets.length - 1] || emptySet()
        return { ...exercise, sets: [...exercise.sets, { ...lastSet }] }
      })
    )
  }

  const removeExercise = (exerciseIndex: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exerciseIndex))
  }

  const toggleFavorite = async (exercise: ExerciseLibrary) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('exercises_library')
        .update({ is_favorite: !exercise.is_favorite })
        .eq('id', exercise.id)
        .eq('user_id', user.id)
      if (error) throw error
      loadLibrary(searchTerm)
    } catch (error) {
      console.error('Error updating favorite:', error)
    }
  }

  const parseNumber = (value: string) => {
    if (!value) return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const serializeExercises = (items: EditableExercise[]) =>
    items.map((exercise) => ({
      name: exercise.name.trim() || 'Exercise',
      lift_type: exercise.liftType.trim() || null,
      equipment: exercise.equipment.trim() || null,
      library_id: exercise.libraryId || null,
      sets: exercise.sets.map((set) => ({
        weight: parseNumber(set.weight),
        reps: parseNumber(set.reps),
        rpe: parseNumber(set.rpe),
        notes: set.notes.trim() ? set.notes.trim() : null,
      })),
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const preparedExercises = serializeExercises(exercises)
      const durationValue = duration ? Number(duration) : null

      const payload = {
        user_id: user.id,
        date,
        workout_type: workoutTitle || 'Workout',
        duration_min: durationValue,
        notes: notes || null,
        volume_json: {
          exercises: preparedExercises,
        },
      }

      if (workoutId) {
        const { error } = await supabase.from('workouts').update(payload).eq('id', workoutId)
        if (error) throw error
      } else {
        const { data: insertData, error } = await supabase
          .from('workouts')
          .insert(payload)
          .select('id')
          .single()
      if (error) throw error
        setWorkoutId(insertData?.id || null)
      }

      await supabase.from('checkins').upsert({
        user_id: user.id,
        date,
        type: 'workout',
        value_json: {
          type: workoutTitle || 'Workout',
          duration_min: durationValue || undefined,
          exercises: preparedExercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets.length,
          })),
        },
        notes: notes || null,
      })

      if (preparedExercises.length > 0) {
        const now = new Date().toISOString()
        const libraryPayload = preparedExercises.map((exercise) => ({
          user_id: user.id,
          name: exercise.name,
          lift_type: exercise.lift_type,
          equipment: exercise.equipment,
          last_used_at: now,
        }))
        const { error: libraryError } = await supabase
          .from('exercises_library')
          .upsert(libraryPayload, { onConflict: 'user_id,name' })
        if (libraryError) throw libraryError
      }

      loadRecentWorkouts()
      toast('Workout saved', 'success')
    } catch (error: any) {
      console.error('Error saving workout:', error)
      toast(error.message || 'Failed to save workout. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const renderExerciseCard = (exercise: EditableExercise, exerciseIndex: number) => (
    <div key={`${exercise.name}-${exerciseIndex}`} className="rounded-3xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">✕</div>
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

        <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => removeExercise(exerciseIndex)}>
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[44px_1fr_1fr_44px] gap-2 text-[11px] font-semibold text-muted-foreground">
          <div>SET</div>
          <div>WT</div>
          <div>REPS</div>
          <div className="text-center">DONE</div>
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
                <input type="checkbox" className="h-5 w-5 accent-blue-600" aria-label="Done" />
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
                  const value = e.target.value
                  setDate(value)
                  loadWorkoutForDate(value)
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
          onClick={() => {
            resetBuilder()
            setExercises([])
          }}
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



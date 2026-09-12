'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { ExerciseLibrary, Workout, WorkoutVolume } from '@/lib/types'
import { toast } from '@/components/ui/toast'
import {
  getWorkoutForDate,
  insertWorkout,
  listExerciseLibrary,
  listRecentWorkouts,
  toggleExerciseFavorite,
  updateWorkout,
  upsertExercisesLibrary,
  upsertWorkoutCheckin,
} from '@/lib/workouts/api'
import {
  EditableExercise,
  EditableSet,
  emptySet,
  serialize,
  toEditableExercises,
} from '@/lib/workouts/types'

const defaultDate = () => format(new Date(), 'yyyy-MM-dd')

export function useWorkouts() {
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

      const { data, error } = await getWorkoutForDate(supabase, user.id, selectedDate)

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

      const { data, error } = await listRecentWorkouts(supabase, user.id, 10)

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

      const { data, error } = await listExerciseLibrary(supabase, user.id, {
        term: term || undefined,
        limit: 50,
      })
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

  const updateExerciseField = (
    index: number,
    field: keyof Omit<EditableExercise, 'sets'>,
    value: string
  ) => {
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

      const { error } = await toggleExerciseFavorite(
        supabase,
        user.id,
        exercise.id,
        !exercise.is_favorite
      )
      if (error) throw error
      loadLibrary(searchTerm)
    } catch (error) {
      console.error('Error updating favorite:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const preparedExercises = serialize(exercises)
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
        const { error } = await updateWorkout(supabase, workoutId, payload)
        if (error) throw error
      } else {
        const { data: insertData, error } = await insertWorkout(supabase, payload)
        if (error) throw error
        setWorkoutId(insertData?.id || null)
      }

      await upsertWorkoutCheckin(supabase, {
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
        const { error: libraryError } = await upsertExercisesLibrary(supabase, libraryPayload)
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

  const selectDate = (value: string) => {
    setDate(value)
    loadWorkoutForDate(value)
  }

  const resetSession = () => {
    resetBuilder()
    setExercises([])
  }

  return {
    date,
    selectDate,
    workoutTitle,
    setWorkoutTitle,
    duration,
    setDuration,
    notes,
    setNotes,
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
  }
}

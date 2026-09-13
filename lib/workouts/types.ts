import type { WorkoutVolume } from '@/lib/types'

export type EditableSet = {
  weight: string
  reps: string
  rpe: string
  notes: string
}

export type EditableExercise = {
  name: string
  liftType: string
  equipment: string
  sets: EditableSet[]
  libraryId?: string | null
}

export const emptySet = (): EditableSet => ({ weight: '', reps: '', rpe: '', notes: '' })

export const toEditableExercises = (volume?: WorkoutVolume | null): EditableExercise[] => {
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

const parseNumber = (value: string) => {
  if (!value) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export const serialize = (items: EditableExercise[]) =>
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

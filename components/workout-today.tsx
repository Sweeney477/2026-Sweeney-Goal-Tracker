'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Dumbbell, Flame, Loader2, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  computeWorkoutConsistencyStreak,
  workoutAnswerFromValue,
  type WorkoutAnswer,
} from '@/lib/workout-day'
import Link from 'next/link'

type Props = {
  initialAnswer: WorkoutAnswer
  initialStreak: number
  reminderEnabled: boolean
}

export function WorkoutTodayCard({ initialAnswer, initialStreak, reminderEnabled }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const today = format(new Date(), 'yyyy-MM-dd')
  const [answer, setAnswer] = useState<WorkoutAnswer>(initialAnswer)
  const [streak, setStreak] = useState(initialStreak)
  const [saving, setSaving] = useState<'yes' | 'rest' | null>(null)

  useEffect(() => {
    setAnswer(initialAnswer)
    setStreak(initialStreak)
  }, [initialAnswer, initialStreak])

  const refreshStreak = async (userId: string) => {
    const { data } = await supabase
      .from('checkins')
      .select('date, value_json')
      .eq('user_id', userId)
      .eq('type', 'workout')
      .order('date', { ascending: false })
      .limit(60)

    const answered = (data || [])
      .filter((row) => workoutAnswerFromValue(row.value_json) != null)
      .map((row) => row.date)

    setStreak(computeWorkoutConsistencyStreak(answered, today))
  }

  const save = async (next: 'yes' | 'rest') => {
    setSaving(next)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast('Please sign in again', 'error')
        return
      }

      const value_json =
        next === 'yes'
          ? { done: true, type: 'Workout' }
          : { done: false, rest: true, type: 'Rest' }

      const { error } = await supabase.from('checkins').upsert(
        {
          user_id: user.id,
          date: today,
          type: 'workout',
          value_json,
          notes: null,
        },
        { onConflict: 'user_id,date,type' }
      )

      if (error) throw error

      setAnswer(next)
      await refreshStreak(user.id)
      toast(next === 'yes' ? 'Logged: worked out' : 'Logged: rest day', 'success')
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Could not save workout answer', 'error')
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Today&apos;s only job
          </div>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Did you work out?</h2>
          <p className="mt-1 text-sm text-white/70">One tap. That&apos;s the habit.</p>
        </div>
        <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-300">
            <Flame className="h-4 w-4" />
            <span className="text-lg font-semibold">{streak}</span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-white/60">
            day streak
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={saving != null}
          onClick={() => void save('yes')}
          className={cn(
            'h-24 flex-col gap-2 rounded-2xl border-0 text-base font-semibold shadow-none',
            answer === 'yes'
              ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-400'
              : 'bg-white text-slate-900 hover:bg-white/90'
          )}
        >
          {saving === 'yes' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Dumbbell className="h-6 w-6" />
          )}
          Yes
        </Button>
        <Button
          type="button"
          disabled={saving != null}
          onClick={() => void save('rest')}
          className={cn(
            'h-24 flex-col gap-2 rounded-2xl border-0 text-base font-semibold shadow-none',
            answer === 'rest'
              ? 'bg-sky-300 text-sky-950 hover:bg-sky-300'
              : 'bg-white/15 text-white hover:bg-white/25'
          )}
        >
          {saving === 'rest' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Moon className="h-6 w-6" />
          )}
          Rest
        </Button>
      </div>

      {answer === 'yes' && (
        <Link
          href="/workouts"
          className="mt-4 block text-center text-sm font-medium text-white/80 underline-offset-4 hover:underline"
        >
          Optional: log sets &amp; details
        </Link>
      )}

      {!reminderEnabled && (
        <div className="mt-4 rounded-2xl bg-white/10 px-3 py-3 text-sm text-white/85">
          You forget to open the app — turn on a daily nudge in{' '}
          <Link href="/settings" className="font-semibold underline underline-offset-2">
            Settings
          </Link>
          .
        </div>
      )}
    </section>
  )
}

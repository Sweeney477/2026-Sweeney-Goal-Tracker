'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft } from 'lucide-react'
import { SoftCard } from '@/components/soft-ui'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  markWeekClosedToastPending,
  readClosedWeeklyRitual,
  ritualWeekLabel,
  writeClosedWeeklyRitual,
  type ClosedWeeklyRitual,
  type WeeklyRitualAnswers,
} from '@/lib/review/weekly-ritual'

type StepId = 0 | 1 | 2

const STEPS: { id: StepId; title: string; prompt: string; placeholder: string; optional?: boolean }[] = [
  {
    id: 0,
    title: 'What went well',
    prompt: 'Name one or two things that felt steady this week.',
    placeholder: 'e.g. Morning weigh-ins stayed consistent…',
  },
  {
    id: 1,
    title: 'What to adjust',
    prompt: 'Gently note what you’d like to shift next week.',
    placeholder: 'e.g. Earlier bedtime on weeknights…',
  },
  {
    id: 2,
    title: 'Optional note',
    prompt: 'Anything else worth remembering?',
    placeholder: 'A short note for future-you…',
    optional: true,
  },
]

export type WeeklyRitualFlowProps = {
  userId: string
  timeZone: string
  weekStart: string
}

export function WeeklyRitualFlow({ userId, timeZone, weekStart }: WeeklyRitualFlowProps) {
  const router = useRouter()
  const weekLabel = useMemo(() => ritualWeekLabel(weekStart, timeZone), [weekStart, timeZone])
  const [hydrated, setHydrated] = useState(false)
  const [existing, setExisting] = useState<ClosedWeeklyRitual | null>(null)
  const [step, setStep] = useState<StepId>(0)
  const [answers, setAnswers] = useState<WeeklyRitualAnswers>({
    wentWell: '',
    adjust: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const closed = readClosedWeeklyRitual(userId, weekStart)
    setExisting(closed)
    if (closed) {
      setAnswers({
        wentWell: closed.wentWell,
        adjust: closed.adjust,
        note: closed.note,
      })
    }
    setHydrated(true)
  }, [userId, weekStart])

  const current = STEPS[step]
  const fieldKey = step === 0 ? 'wentWell' : step === 1 ? 'adjust' : 'note'
  const value = answers[fieldKey]
  const canContinue =
    current.optional || value.trim().length > 0

  const updateField = (next: string) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: next }))
  }

  const goBack = () => {
    if (step === 0) return
    setStep((s) => (s - 1) as StepId)
  }

  const goNext = () => {
    if (!canContinue) return
    if (step < 2) {
      setStep((s) => (s + 1) as StepId)
      return
    }
    closeWeek()
  }

  const closeWeek = () => {
    if (submitting) return
    if (!answers.wentWell.trim() || !answers.adjust.trim()) {
      toast('Add a short note for what went well and what to adjust.', 'info')
      setStep(answers.wentWell.trim() ? 1 : 0)
      return
    }
    setSubmitting(true)
    writeClosedWeeklyRitual(userId, weekStart, answers)
    markWeekClosedToastPending()
    toast('Week closed', 'success')
    router.push('/dashboard')
  }

  if (!hydrated) {
    return (
      <div className="space-y-4" data-testid="weekly-ritual-loading">
        <div className="h-8 w-48 animate-pulse rounded-full bg-muted/60" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-muted/40" />
      </div>
    )
  }

  if (existing) {
    return (
      <div className="space-y-5" data-testid="weekly-ritual-closed">
        <header>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Weekly review</h1>
          <p className="mt-1 text-sm text-muted-foreground">{weekLabel}</p>
        </header>

        <SoftCard tone="mint" className="p-5">
          <div className="flex items-center gap-2 text-brand">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/70">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="font-display text-lg font-semibold tracking-tight text-foreground">
              Week closed
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground/60">
            A calm close for this week. You can revisit your notes below anytime.
          </p>
        </SoftCard>

        <SoftCard className="space-y-4 p-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
              What went well
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/80">{existing.wentWell}</p>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
              What to adjust
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/80">{existing.adjust}</p>
          </div>
          {existing.note ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                Note
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/80">{existing.note}</p>
            </div>
          ) : null}
        </SoftCard>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground transition-transform active:scale-[0.99]"
          data-testid="weekly-ritual-back-today"
        >
          Back to Today
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5" data-testid="weekly-ritual-flow">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Weekly review</h1>
        <p className="mt-1 text-sm text-muted-foreground">{weekLabel} · a short close for the week</p>
      </header>

      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 3`}>
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              s.id <= step ? 'bg-brand' : 'bg-foreground/10'
            )}
          />
        ))}
      </div>

      <SoftCard className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Step {step + 1} of 3
        </div>
        <h2 className="font-display mt-2 text-xl font-semibold tracking-tight">{current.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.prompt}</p>
        <label className="sr-only" htmlFor={`ritual-${fieldKey}`}>
          {current.title}
        </label>
        <textarea
          id={`ritual-${fieldKey}`}
          value={value}
          onChange={(e) => updateField(e.target.value)}
          rows={5}
          placeholder={current.placeholder}
          className={cn(
            'mt-4 w-full resize-none rounded-[1.25rem] border border-border/60 bg-background/80',
            'px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground/35',
            'outline-none ring-brand/20 focus:ring-2'
          )}
          data-testid={`weekly-ritual-input-${fieldKey}`}
        />
        {current.optional ? (
          <p className="mt-2 text-xs text-muted-foreground">Optional — skip if nothing to add.</p>
        ) : null}
      </SoftCard>

      <div className="flex gap-3 pb-safe">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className={cn(
              'inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full',
              'bg-card text-sm font-semibold text-foreground shadow-soft ring-1 ring-border/50',
              'transition-transform active:scale-[0.99]'
            )}
            data-testid="weekly-ritual-back"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue || submitting}
          className={cn(
            'inline-flex h-12 flex-1 items-center justify-center rounded-full',
            'bg-brand text-sm font-semibold text-brand-foreground',
            'transition-transform active:scale-[0.99]',
            'disabled:cursor-not-allowed disabled:opacity-45',
            step === 0 && 'w-full'
          )}
          data-testid={step === 2 ? 'weekly-ritual-close' : 'weekly-ritual-next'}
        >
          {step === 2 ? (submitting ? 'Closing…' : 'Close the week') : 'Continue'}
        </button>
      </div>
    </div>
  )
}

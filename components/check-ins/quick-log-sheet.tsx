'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import {
  isQuickLogMetric,
  saveQuickLogMetric,
  type QuickLogMetricId,
  type QuickLogSaveResult,
} from '@/lib/checkins/quick-log'
import { pastelTone, trackerById, type SoftPastel } from '@/lib/config/trackers'
import { weightUnitLabel, type UnitSystem } from '@/lib/units'
import { dayRelativeLabel } from '@/lib/dates'
import { cn } from '@/lib/utils'

const toneWash: Record<ReturnType<typeof pastelTone>, string> = {
  mint: 'pastel-mint',
  peach: 'pastel-peach',
  lilac: 'pastel-lilac',
  butter: 'pastel-butter',
  sky: 'pastel-sky',
  rose: 'pastel-rose',
}

export type QuickLogSuggestions = {
  weight?: string
  steps?: string
  codingMinutes?: string
  project?: string
}

export type QuickLogSheetProps = {
  open: boolean
  onClose: () => void
  metric: QuickLogMetricId | null
  /** Local day key `yyyy-MM-dd`. Defaults to caller’s today; set for #13 catch-up. */
  date: string
  timeZone: string
  units: UnitSystem
  suggestions?: QuickLogSuggestions
  /** Prefill when editing a value already logged today. */
  initialValue?: string
  onSaved?: (result: QuickLogSaveResult) => void
}

export function QuickLogSheet({
  open,
  onClose,
  metric,
  date,
  timeZone,
  units,
  suggestions,
  initialValue,
  onSaved,
}: QuickLogSheetProps) {
  const [value, setValue] = useState('')
  const [project, setProject] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !metric) return
    if (metric === 'weight') {
      setValue(initialValue || suggestions?.weight || '')
      setProject('')
    } else if (metric === 'steps') {
      setValue(initialValue || suggestions?.steps || '')
      setProject('')
    } else {
      setValue(initialValue || suggestions?.codingMinutes || '')
      setProject(suggestions?.project || '')
    }
  }, [open, metric, initialValue, suggestions])

  if (!metric || !isQuickLogMetric(metric)) return null

  const tracker = trackerById(metric)
  const tone = pastelTone((tracker?.accent || 'pastel-mint') as SoftPastel)
  const weightLabel = weightUnitLabel(units)
  const dayHint = dayRelativeLabel(date, timeZone)
  const description =
    dayHint === 'Today'
      ? tracker?.helper
      : dayHint === 'Yesterday'
        ? `Logging for yesterday · ${date}`
        : `Logging for ${date}`

  const fullLogHref = `/check-ins?type=${tracker?.queryAliases[0] ?? metric}`

  const fieldLabel =
    metric === 'weight'
      ? `Weight (${weightLabel})`
      : metric === 'steps'
        ? 'Steps'
        : 'Coding minutes'

  const placeholder =
    metric === 'weight'
      ? suggestions?.weight || 'e.g., 185.2'
      : metric === 'steps'
        ? suggestions?.steps || 'e.g., 8000'
        : suggestions?.codingMinutes || 'e.g., 90'

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in to save')

      const result = await saveQuickLogMetric(supabase, {
        userId: user.id,
        date,
        metric,
        value,
        project: metric === 'code' ? project : undefined,
      })
      toast('Saved', 'success')
      onSaved?.(result)
      onClose()
    } catch (error: unknown) {
      console.error('Quick log save failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to save. Please try again.'
      toast(message || 'Failed to save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Log ${tracker?.label ?? metric}`}
      description={description}
      toneClassName={toneWash[tone]}
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="quick-log-value">{fieldLabel}</Label>
          <Input
            id="quick-log-value"
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="h-12 rounded-2xl border-border/70 bg-background text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSave()
              }
            }}
          />
          {metric !== 'code' && (suggestions?.weight || suggestions?.steps) ? (
            <p className="text-xs text-muted-foreground">
              Suggested:{' '}
              {metric === 'weight' ? suggestions?.weight || '—' : suggestions?.steps || '—'}
            </p>
          ) : null}
          {metric === 'code' && suggestions?.codingMinutes ? (
            <p className="text-xs text-muted-foreground">
              Suggested: {suggestions.codingMinutes} min
            </p>
          ) : null}
        </div>

        {metric === 'code' ? (
          <div className="space-y-2">
            <Label htmlFor="quick-log-project">Project</Label>
            <Input
              id="quick-log-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder={suggestions?.project || 'Project name'}
              className="h-11 rounded-2xl border-border/70 bg-background"
            />
          </div>
        ) : null}

        <Button
          className="h-12 w-full rounded-full text-base font-semibold"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>

        <Link
          href={fullLogHref}
          className={cn(
            'flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-brand',
            'transition-colors hover:bg-brand/5'
          )}
          onClick={onClose}
        >
          Open full log
        </Link>
      </div>
    </BottomSheet>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { COMMON_TIMEZONES, timezoneLabel } from '@/lib/config/timezones'
import { detectBrowserTimezone } from '@/lib/dates'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TimezoneSelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimezoneSelect({ id, value, onChange, className }: TimezoneSelectProps) {
  const [query, setQuery] = useState('')
  const browserTz = useMemo(() => detectBrowserTimezone(), [])

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = [...COMMON_TIMEZONES]
    if (browserTz && !base.some((z) => z.value === browserTz)) {
      base.unshift({ value: browserTz, label: `Detected · ${browserTz}` })
    }
    if (value && !base.some((z) => z.value === value)) {
      base.unshift({ value, label: value })
    }
    if (!q) return base
    return base.filter(
      (z) => z.value.toLowerCase().includes(q) || z.label.toLowerCase().includes(q)
    )
  }, [browserTz, query, value])

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        id={id}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search timezones…"
        autoComplete="off"
        aria-label="Search timezones"
      />
      <select
        aria-label="Timezone"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={5}
      >
        {options.map((z) => (
          <option key={z.value} value={z.value}>
            {z.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{timezoneLabel(value)}</span>
        {browserTz && value !== browserTz ? (
          <>
            {' '}
            · Browser is {browserTz}.{' '}
            <button
              type="button"
              className="font-medium text-brand underline-offset-2 hover:underline"
              onClick={() => onChange(browserTz)}
            >
              Use detected
            </button>
          </>
        ) : null}
      </p>
    </div>
  )
}

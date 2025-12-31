'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WeeklyReview } from '@/lib/types'
import { Sparkles, ChevronRight, Flame, Crown, Loader2 } from 'lucide-react'
import { format, startOfWeek, addDays } from 'date-fns'
import { toast } from '@/components/ui/toast'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function ReviewPage() {
  const [review, setReview] = useState<WeeklyReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(7)

  const generateReview = async () => {
    setLoading(true)
    setReview(null) // Clear previous review while generating
    try {
      const response = await fetch(`${BASE_PATH}/api/ai/weekly-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        throw new Error(errorData.error || 'Failed to generate review')
      }

      const data = await response.json()
      if (data.review) {
        setReview(data.review)
        toast('Weekly review generated successfully!', 'success')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error generating review:', error)
      const errorMessage = error.message || 'Failed to generate review. Please try again.'
      toast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const weekStart = startOfWeek(new Date())
  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`

  const winsCount = review?.wins?.length || 0
  const risksCount = review?.risks?.length || 0
  const changesCount = review?.changes?.length || 0

  const completion = review ? Math.max(0, Math.min(100, Math.round((winsCount / Math.max(1, winsCount + risksCount)) * 100))) : 0
  const focusScore = review ? Math.max(0, Math.min(10, 10 - risksCount * 1.2 + winsCount * 0.4)) : 0

  const xp = review ? 2000 + winsCount * 120 - risksCount * 80 : 2450
  const nextXp = 3000

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Weekly Review</h1>
          <div className="mt-1 text-sm text-muted-foreground">{weekLabel}</div>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-blue-600"
          onClick={() => toast('History view coming soon', 'info')}
        >
          History
        </button>
      </div>

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          LEVEL UNLOCKED
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold">
              Consistency King <span className="inline-block align-middle"><Crown className="ml-1 inline h-5 w-5 text-yellow-300" /></span>
            </div>
            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-xs opacity-90">Next Level Progress</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(0, Math.min(100, (xp / nextXp) * 100))}%` }} />
              </div>
              <div className="mt-2 text-sm font-semibold">
                {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
              </div>
              <div className="mt-1 text-xs opacity-80">+{Math.max(0, winsCount * 120).toLocaleString()} XP earned this week</div>
            </div>
          </div>

          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-yellow-400/15 text-yellow-300">
            <Flame className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Generate insights */}
      {!review ? (
        <div className="rounded-3xl border border-dashed bg-background p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Generate Your Weekly Review</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get AI-powered insights based on your recent check-ins, goals, and projects
          </p>
          <Button
            onClick={generateReview}
            disabled={loading}
            className="mt-6 h-12 rounded-2xl bg-blue-600 text-white hover:bg-blue-600/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-3xl border border-dashed bg-background px-4 py-4 text-left shadow-sm"
          onClick={generateReview}
          disabled={loading as any}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Regenerate Insights</div>
              <div className="text-xs text-muted-foreground">Generate a new weekly summary</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      <details className="rounded-3xl border bg-background p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          Settings
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </summary>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Days to analyze</label>
          <input
            type="number"
            min="1"
            max="30"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 7)}
            className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
          />
          <Button className="mt-2 rounded-2xl" onClick={generateReview} disabled={loading}>
            {loading ? 'Generating…' : 'Generate Weekly Review'}
          </Button>
        </div>
      </details>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700">⚡</div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground">Focus Score</div>
            {review ? <Badge className="bg-emerald-50 text-emerald-700">+{Math.max(0, Math.round(winsCount - risksCount))}%</Badge> : null}
          </div>
          <div className="mt-2 text-3xl font-semibold">{review ? focusScore.toFixed(1) : '—'}</div>
        </div>
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">✓</div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground">Completion</div>
            {review ? <Badge className="bg-blue-50 text-blue-700">Top 5%</Badge> : null}
          </div>
          <div className="mt-2 text-3xl font-semibold">{review ? `${completion}%` : '—'}</div>
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Activity Trends</div>
            <div className="text-xs text-muted-foreground">Consistency over last 7 days</div>
          </div>
          <button type="button" className="text-muted-foreground" aria-label="More">
            •••
          </button>
        </div>
        <div className="mt-4 h-32 rounded-2xl bg-muted/30" />
      </div>

      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="text-sm font-semibold">Category Breakdown</div>
        <div className="mt-4 space-y-4">
          {[
            { label: 'Health & Fitness', value: review ? Math.min(100, 60 + winsCount * 4) : 0, color: 'bg-blue-600' },
            { label: 'Learning', value: review ? Math.min(100, 25 + changesCount * 10) : 0, color: 'bg-violet-600' },
            { label: 'Mindfulness', value: review ? Math.min(100, 40 - risksCount * 5) : 0, color: 'bg-emerald-600' },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">{row.label}</div>
                <div className="text-muted-foreground">{review ? `${Math.round(row.value)}%` : '—'}</div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={row.color + ' h-full rounded-full'} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed insights */}
      {review && (
        <details className="rounded-3xl border bg-background p-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            Detailed Insights
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </summary>
          <div className="mt-4 space-y-4 text-sm">
            {review.wins?.length ? (
              <div>
                <div className="font-semibold">Wins</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {review.wins.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {review.risks?.length ? (
              <div>
                <div className="font-semibold">Risks</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {review.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {review.changes?.length ? (
              <div>
                <div className="font-semibold">Recommended Changes</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {review.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {review.next_week_plan?.length ? (
              <div>
                <div className="font-semibold">Next Week Plan</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {review.next_week_plan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {review.priority_goal ? (
              <div>
                <div className="font-semibold">Priority Goal</div>
                <div className="mt-2 text-muted-foreground">{review.priority_goal}</div>
              </div>
            ) : null}
          </div>
        </details>
      )}
    </div>
  )
}


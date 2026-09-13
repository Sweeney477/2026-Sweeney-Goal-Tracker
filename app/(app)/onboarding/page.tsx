'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2, Target } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { TimezoneSelect } from '@/components/timezone-select'
import { detectBrowserTimezone, resolveTimezone } from '@/lib/dates'
import { LoadingState } from '@/components/loading-state'
import { brand } from '@/lib/config/brand'

type Step = 'units' | 'goals' | 'complete'

export default function OnboardingPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<Step>('units')

  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial')
  const [timezone, setTimezone] = useState(() => detectBrowserTimezone())
  const [calorieGoal, setCalorieGoal] = useState('2200')
  const [stepGoal, setStepGoal] = useState('10000')
  const [codingGoal, setCodingGoal] = useState('240')

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Select the fields we may use to pre-fill the onboarding UI.
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'onboarding_completed_at, units, timezone, calorie_goal, step_goal, coding_goal_minutes'
          )
          .eq('user_id', user.id)
          .single()

        if (profile?.onboarding_completed_at) {
          router.push('/dashboard')
          return
        }

        // Pre-fill with existing profile data if available
        if (profile) {
          if (profile.units) setUnits(profile.units)
          if (profile.timezone) setTimezone(profile.timezone)
          if (profile.calorie_goal) setCalorieGoal(String(profile.calorie_goal))
          if (profile.step_goal) setStepGoal(String(profile.step_goal))
          if (profile.coding_goal_minutes) setCodingGoal(String(profile.coding_goal_minutes))
        }
      } catch (err) {
        console.error('Error checking onboarding:', err)
      } finally {
        setLoading(false)
      }
    }

    void checkOnboardingStatus()
  }, [router, supabase])

  const handleNext = async () => {
    if (step === 'units') {
      setStep('goals')
      return
    }

    if (step === 'goals') {
      await handleComplete()
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Use upsert to handle both create and update cases
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            units,
            timezone: resolveTimezone(timezone),
            calorie_goal: calorieGoal ? Number(calorieGoal) : null,
            step_goal: stepGoal ? Number(stepGoal) : null,
            coding_goal_minutes: codingGoal ? Number(codingGoal) : null,
            onboarding_completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )

      if (error) {
        console.error('Profile update error:', error)
        throw error
      }

      // Small delay to ensure the update is processed
      await new Promise((resolve) => setTimeout(resolve, 100))

      router.push('/goals/new?onboarding=true')
    } catch (err: any) {
      console.error('Error completing onboarding:', err)
      toast(err.message || 'Failed to save settings. Please try again.', 'error')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <LoadingState label="Loading onboarding" variant="form" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand text-brand-foreground">
          <Target className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Welcome to {brand.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{brand.tagline}</p>
      </div>

      {step === 'units' && (
        <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Units & Timezone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your preferred measurement system
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="units" className="text-sm font-semibold">
                Units
              </Label>
              <select
                id="units"
                value={units}
                onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="imperial">Imperial (lbs, ft)</option>
                <option value="metric">Metric (kg, cm)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm font-semibold">
                Timezone
              </Label>
              <TimezoneSelect id="timezone" value={timezone} onChange={setTimezone} />
              <p className="text-xs text-muted-foreground">
                Your local day for logs, streaks, and history.
              </p>
            </div>
          </div>

          <Button
            onClick={handleNext}
            className="h-11 w-full rounded-xl"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 'goals' && (
        <div className="space-y-6 rounded-3xl border bg-background p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Daily Goals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set your daily targets (you can change these later)
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie_goal" className="text-sm font-semibold">
                Daily Calorie Goal
              </Label>
              <Input
                id="calorie_goal"
                type="number"
                min="1000"
                max="10000"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                placeholder="2200"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="step_goal" className="text-sm font-semibold">
                Daily Step Goal
              </Label>
              <Input
                id="step_goal"
                type="number"
                min="1000"
                max="100000"
                value={stepGoal}
                onChange={(e) => setStepGoal(e.target.value)}
                placeholder="10000"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coding_goal" className="text-sm font-semibold">
                Daily Coding Goal (minutes)
              </Label>
              <Input
                id="coding_goal"
                type="number"
                min="0"
                max="1440"
                value={codingGoal}
                onChange={(e) => setCodingGoal(e.target.value)}
                placeholder="240"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('units')}
              className="h-12 flex-1 rounded-2xl"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                console.log('Complete Setup clicked')
                void handleComplete()
              }}
              disabled={saving}
              className="h-12 flex-1 rounded-2xl bg-brand text-brand-foreground hover:bg-brand-deep"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


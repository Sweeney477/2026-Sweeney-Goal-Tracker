'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Loader2, Download, Trash2, AlertTriangle } from 'lucide-react'
import { TimezoneSelect } from '@/components/timezone-select'
import { LoadingState } from '@/components/loading-state'
import { detectBrowserTimezone, resolveTimezone } from '@/lib/dates'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      const next = data || {}
      if (!next.timezone) {
        next.timezone = detectBrowserTimezone()
      }
      setProfile(next)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const updates: Partial<Profile> = {
        timezone: resolveTimezone(profile.timezone),
        units: profile.units || 'imperial',
        calorie_goal: profile.calorie_goal ? Number(profile.calorie_goal) : null,
        step_goal: profile.step_goal ? Number(profile.step_goal) : null,
        coding_goal_minutes: profile.coding_goal_minutes ? Number(profile.coding_goal_minutes) : null,
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`${BASE_PATH}/api/export`)
      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `goaltracker-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`${BASE_PATH}/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Redirect to login
      window.location.href = `${BASE_PATH}/auth/login`
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Loading settings" variant="form" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-foreground">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Units, timezone, and daily targets. Timezone defines your local day across the app.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Settings saved successfully!
        </div>
      )}

      <div className="space-y-6 rounded-2xl border bg-card p-6">
        {/* Units */}
        <div className="space-y-3">
          <Label htmlFor="units" className="text-sm font-semibold">
            Units
          </Label>
          <select
            id="units"
            value={profile.units || 'imperial'}
            onChange={(e) => setProfile({ ...profile, units: e.target.value as 'metric' | 'imperial' })}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
          >
            <option value="imperial">Imperial (lbs, ft)</option>
            <option value="metric">Metric (kg, cm)</option>
          </select>
        </div>

        {/* Timezone */}
        <div className="space-y-3">
          <Label htmlFor="timezone" className="text-sm font-semibold">
            Timezone
          </Label>
          <TimezoneSelect
            id="timezone"
            value={resolveTimezone(profile.timezone)}
            onChange={(timezone) => setProfile({ ...profile, timezone })}
          />
          <p className="text-xs text-muted-foreground">
            Check-ins, meals, workouts, and streaks use this calendar day — not UTC midnight.
          </p>
        </div>

        {/* Calorie Goal */}
        <div className="space-y-3">
          <Label htmlFor="calorie_goal" className="text-sm font-semibold">
            Daily Calorie Goal
          </Label>
          <Input
            id="calorie_goal"
            type="number"
            min="1000"
            max="10000"
            value={profile.calorie_goal || ''}
            onChange={(e) =>
              setProfile({ ...profile, calorie_goal: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="2200"
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">Target calories per day</p>
        </div>

        {/* Step Goal */}
        <div className="space-y-3">
          <Label htmlFor="step_goal" className="text-sm font-semibold">
            Daily Step Goal
          </Label>
          <Input
            id="step_goal"
            type="number"
            min="1000"
            max="100000"
            value={profile.step_goal || ''}
            onChange={(e) =>
              setProfile({ ...profile, step_goal: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="10000"
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">Target steps per day</p>
        </div>

        {/* Coding Goal */}
        <div className="space-y-3">
          <Label htmlFor="coding_goal_minutes" className="text-sm font-semibold">
            Daily Coding Goal (minutes)
          </Label>
          <Input
            id="coding_goal_minutes"
            type="number"
            min="0"
            max="1440"
            value={profile.coding_goal_minutes || ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                coding_goal_minutes: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="240"
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">Target coding minutes per day</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 w-full rounded-xl"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Export Data */}
      <div className="space-y-4 rounded-3xl border bg-background p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Export Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download all your data as a JSON file
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          className="h-12 w-full rounded-2xl"
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </>
          )}
        </Button>
      </div>

      {/* Delete Account */}
      <div className="space-y-4 rounded-3xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-red-700">Delete Account</h2>
          <p className="mt-1 text-sm text-red-600">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="h-12 w-full rounded-2xl border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-red-300 bg-white p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-700">Warning</div>
                  <div className="mt-1 text-sm text-red-600">
                    This will permanently delete your account and all your data. Type{' '}
                    <span className="font-mono font-semibold">DELETE</span> to confirm.
                  </div>
                </div>
              </div>
            </div>
            <Input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="h-12 rounded-2xl border-red-300"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirm('')
                }}
                variant="outline"
                className="h-12 flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== 'DELETE'}
                className="h-12 flex-1 rounded-2xl bg-red-600 text-white hover:bg-red-600/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import { brand } from '@/lib/config/brand'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    const boot = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) {
        setMessage('Open this page from your password reset email link.')
        setReady(false)
        return
      }
      setReady(true)
    }
    void boot()
    return () => {
      mounted = false
    }
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setMessage('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Password updated. Redirecting…')
      window.setTimeout(() => {
        // Next.js router already applies basePath — do not prefix BASE_PATH here.
        router.push('/dashboard')
      }, 800)
    } catch (error: any) {
      setMessage(error.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-soft app-dots min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl shadow-sm ${brand.markClassName}`}
          >
            <span className="font-display text-xl font-semibold">{brand.shortName}</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Choose a new password</h1>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-xs font-semibold tracking-wide text-muted-foreground">
                New password
              </Label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                  className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="confirm"
                className="text-xs font-semibold tracking-wide text-muted-foreground"
              >
                Confirm password
              </Label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!ready}
                  className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-brand text-brand-foreground hover:bg-brand-deep"
              disabled={loading || !ready}
            >
              {loading ? 'Saving…' : 'Update password'}
            </Button>

            <Link href="/auth/login" className="block text-center text-sm font-medium text-brand">
              Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}

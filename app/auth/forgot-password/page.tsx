'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import { brand } from '@/lib/config/brand'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${BASE_PATH}/auth/reset`,
      })
      if (error) throw error
      setSent(true)
      setMessage('Check your email for a password reset link.')
    } catch (error: any) {
      setMessage(error.message || 'Could not send reset email.')
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
          <h1 className="font-display text-3xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We’ll email you a link to choose a new password.
          </p>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-muted-foreground">
                Email
              </Label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                <Mail className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {message ? (
              <p className={`text-sm ${sent ? 'text-emerald-700' : 'text-muted-foreground'}`}>{message}</p>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-brand text-brand-foreground hover:bg-brand-deep"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send reset link'}
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

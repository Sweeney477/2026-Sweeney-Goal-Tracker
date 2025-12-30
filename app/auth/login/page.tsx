'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Apple, Mail, Lock, Chrome } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setMessage(error.message || 'Failed to start OAuth flow')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('Check your email for the login link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-soft app-dots min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-blue-600 text-white shadow-sm">
            <span className="text-xl font-semibold">GT</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">GoalTracker</h1>
          <p className="mt-2 text-base text-muted-foreground">Level up your daily habits.</p>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-5">
            <div className="text-xs font-semibold tracking-wide text-muted-foreground">EMAIL</div>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-wide text-muted-foreground">PASSWORD</div>
              <button
                type="button"
                className="text-sm font-medium text-blue-600"
                onClick={() => setMessage('Password reset isn’t wired yet. (We can add it next.)')}
              >
                Forgot?
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {message && <p className="mb-3 text-sm text-muted-foreground">{message}</p>}

          <form onSubmit={handleAuth} className="space-y-3">
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-600/90"
              disabled={loading}
            >
              {loading ? 'Loading…' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <div className="flex items-center gap-3 py-3">
              <div className="h-px flex-1 bg-border" />
              <div className="text-sm text-muted-foreground">Or continue with</div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl"
                onClick={() => void handleOAuth('google')}
                disabled={loading}
              >
                <Chrome className="mr-2 h-5 w-5" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl"
                onClick={() => void handleOAuth('apple')}
                disabled={loading}
              >
                <Apple className="mr-2 h-5 w-5" />
                Apple
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-2xl"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">© 2026 Goal Tracker Inc.</p>
      </div>
    </div>
  )
}


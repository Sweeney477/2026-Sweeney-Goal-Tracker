'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Apple, Mail, Lock, Chrome } from 'lucide-react'
import { brand } from '@/lib/config/brand'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setMessage(err)
  }, [])

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${BASE_PATH}/auth/callback`,
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
            emailRedirectTo: `${window.location.origin}${BASE_PATH}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage(
          'Account created. If email confirmation is enabled, check your inbox; otherwise switch to Sign in.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        let appPath = '/dashboard'
        if (next && next.startsWith('/') && !next.startsWith('//')) {
          appPath =
            BASE_PATH && (next === BASE_PATH || next.startsWith(`${BASE_PATH}/`))
              ? next.slice(BASE_PATH.length) || '/dashboard'
              : next
        }
        window.location.href = `${BASE_PATH}${appPath}`
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
          <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl shadow-sm ${brand.markClassName}`}>
            <span className="font-display text-xl font-semibold">{brand.shortName}</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{brand.name}</h1>
          <p className="mt-2 text-base text-muted-foreground">{brand.tagline}</p>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur">
          <form onSubmit={handleAuth} className="space-y-4">
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
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold tracking-wide text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-brand"
                >
                  Forgot?
                </Link>
              </div>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-brand text-brand-foreground hover:bg-brand-deep"
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

        <p className="mt-6 text-center text-sm text-muted-foreground">{brand.description}</p>
      </div>
    </div>
  )
}


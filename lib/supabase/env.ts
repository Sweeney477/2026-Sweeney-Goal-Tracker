/**
 * Shared env helpers — fail loudly with actionable messages when required
 * Supabase config is missing (local `.env.local` or Vercel project settings).
 */

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example → .env.local for local dev, or set both in Vercel → Project → Settings → Environment Variables.'
    )
  }

  return { url, anonKey }
}

/** App pathname prefix (no trailing slash). Matches next.config.js basePath. */
export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? '/goal'
  if (!raw || raw === '/') return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

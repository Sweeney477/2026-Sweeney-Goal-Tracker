import { createClient } from '@/lib/supabase/server'
import { getBasePath } from '@/lib/supabase/env'
import { safeNextPath } from '@/lib/supabase/paths'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin
  const basePath = getBasePath()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback exchange failed:', error.message)
      return NextResponse.redirect(
        `${origin}${basePath}/auth/login?error=${encodeURIComponent('Could not complete sign-in. Try again.')}`
      )
    }
  }

  return NextResponse.redirect(`${origin}${safeNextPath(next, basePath)}`)
}

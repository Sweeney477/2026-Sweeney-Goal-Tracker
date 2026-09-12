import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function safeNextPath(next: string | null, basePath: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return `${basePath}/dashboard`
  }
  return `${basePath}${next}`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${safeNextPath(next, basePath)}`)
}

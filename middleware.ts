import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle onboarding redirect for authenticated users
  if (user) {
    const pathname = request.nextUrl.pathname
    const isOnboardingPage = pathname === '/onboarding'
    const isAuthPage = pathname.startsWith('/auth/')

    if (!isOnboardingPage && !isAuthPage) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single()

      if (!profile?.onboarding_completed_at) {
        // Redirect to onboarding if not completed
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // If user is on onboarding page but already completed, redirect to dashboard
    if (isOnboardingPage) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single()

      if (profile?.onboarding_completed_at) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


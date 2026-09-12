import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isModuleEnabled } from '@/lib/config/modules'
import { moduleIdFromPath } from '@/lib/config/module-path'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/goal'

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

  const pathname = request.nextUrl.pathname
  const path =
    pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname

  // Disabled feature modules redirect to dashboard (config-driven forks).
  const moduleId = moduleIdFromPath(path)
  if (moduleId && moduleId !== 'dashboard' && !isModuleEnabled(moduleId)) {
    const url = request.nextUrl.clone()
    url.pathname = `${BASE_PATH}/dashboard`
    return NextResponse.redirect(url)
  }

  // Handle onboarding redirect for authenticated users
  if (user) {
    const isOnboardingPage = path === '/onboarding'
    const isAuthPage = path.startsWith('/auth/')

    if (!isOnboardingPage && !isAuthPage) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single()

      if (!profile?.onboarding_completed_at) {
        // Redirect to onboarding if not completed
        const url = request.nextUrl.clone()
        url.pathname = `${BASE_PATH}/onboarding`
        return NextResponse.redirect(url)
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
        const url = request.nextUrl.clone()
        url.pathname = `${BASE_PATH}/dashboard`
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Only run on app pages under the basePath; avoid Next internals and API routes.
    '/goal',
    '/goal/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


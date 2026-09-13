import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isModuleEnabled } from '@/lib/config/modules'
import { moduleIdFromPath } from '@/lib/config/module-path'
import { getBasePath } from '@/lib/supabase/env'
import { isVisualReview } from '@/lib/supabase/visual-mock'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const BASE_PATH = getBasePath()
  const pathname = request.nextUrl.pathname
  const path =
    BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname

  // Disabled feature modules redirect to dashboard (config-driven forks).
  const moduleId = moduleIdFromPath(path)
  if (moduleId && moduleId !== 'dashboard' && !isModuleEnabled(moduleId)) {
    const url = request.nextUrl.clone()
    url.pathname = `${BASE_PATH}/dashboard`
    return NextResponse.redirect(url)
  }

  // Local visual-review / screenshot tours — skip live Supabase auth (never in production).
  if (isVisualReview()) {
    return response
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) {
    // Let the app render; client/server helpers throw actionable errors.
    return response
  }

  const supabase = createServerClient(url, anonKey, {
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
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = path.startsWith('/auth/')
  const isOnboardingPage = path === '/onboarding'

  // Protected app surfaces require a session (layout also enforces this).
  if (!user && !isAuthPage) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `${BASE_PATH}/auth/login`
    loginUrl.searchParams.set('next', path === '/' ? '/dashboard' : path)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthPage && !path.startsWith('/auth/callback') && path !== '/auth/reset') {
    const dash = request.nextUrl.clone()
    dash.pathname = `${BASE_PATH}/dashboard`
    return NextResponse.redirect(dash)
  }

  if (user) {
    if (!isOnboardingPage && !isAuthPage) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single()

      if (!profile?.onboarding_completed_at) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = `${BASE_PATH}/onboarding`
        return NextResponse.redirect(onboardingUrl)
      }
    }

    if (isOnboardingPage) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single()

      if (profile?.onboarding_completed_at) {
        const dash = request.nextUrl.clone()
        dash.pathname = `${BASE_PATH}/dashboard`
        return NextResponse.redirect(dash)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Only run on app pages under the basePath; avoid Next internals and API routes.
    '/goal',
    '/goal/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
}

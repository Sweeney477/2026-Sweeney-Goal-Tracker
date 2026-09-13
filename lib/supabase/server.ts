import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from '@/lib/supabase/env'
import { createVisualMockClient, isVisualReview } from '@/lib/supabase/visual-mock'

export async function createClient() {
  if (isVisualReview()) {
    return createVisualMockClient() as unknown as SupabaseClient
  }

  const cookieStore = await cookies()
  const { url, anonKey } = getSupabasePublicEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Called from a Server Component — middleware refreshes sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Called from a Server Component — middleware refreshes sessions.
        }
      },
    },
  })
}


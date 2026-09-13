import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from '@/lib/supabase/env'
import { createVisualMockClient, isVisualReview } from '@/lib/supabase/visual-mock'

export function createClient() {
  if (isVisualReview()) {
    return createVisualMockClient() as unknown as SupabaseClient
  }

  const { url, anonKey } = getSupabasePublicEnv()
  return createBrowserClient(url, anonKey)
}


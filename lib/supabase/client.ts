import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createVisualMockClient, isVisualReview } from '@/lib/supabase/visual-mock'

export function createClient() {
  if (isVisualReview()) {
    return createVisualMockClient() as unknown as SupabaseClient
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}


import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client for privileged server operations (account deletion).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset so callers can fail clearly.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

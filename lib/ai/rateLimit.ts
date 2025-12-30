import { createClient } from '@/lib/supabase/server'

export type RouteKey = 'goal-plan' | 'meal-estimate' | 'weekly-review'

export interface RateLimitConfig {
  maxRequests: number
  windowMinutes: number
}

const RATE_LIMITS: Record<RouteKey, RateLimitConfig> = {
  'goal-plan': { maxRequests: 10, windowMinutes: 60 },
  'meal-estimate': { maxRequests: 20, windowMinutes: 60 },
  'weekly-review': { maxRequests: 5, windowMinutes: 60 },
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number
}

/**
 * Check if a user has exceeded their rate limit for a given route.
 * Returns rate limit status and remaining requests.
 */
export async function checkRateLimit(
  userId: string,
  routeKey: RouteKey
): Promise<RateLimitResult> {
  const supabase = await createClient()
  const config = RATE_LIMITS[routeKey]

  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

  // Count requests in the current window
  const { data: requests, error } = await supabase
    .from('rate_limits')
    .select('id')
    .eq('user_id', userId)
    .eq('route_key', routeKey)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    console.error('Error checking rate limit:', error)
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
    }
  }

  const requestCount = requests?.length || 0
  const remaining = Math.max(0, config.maxRequests - requestCount)
  const allowed = requestCount < config.maxRequests

  const resetAt = new Date()
  resetAt.setMinutes(resetAt.getMinutes() + config.windowMinutes)

  return {
    allowed,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - Date.now()) / 1000),
  }
}

/**
 * Record a rate limit request for a user and route.
 */
export async function recordRateLimit(userId: string, routeKey: RouteKey): Promise<void> {
  const supabase = await createClient()

  await supabase.from('rate_limits').insert({
    user_id: userId,
    route_key: routeKey,
  })

  // Clean up old entries (older than 24 hours) periodically
  // This is a simple cleanup - in production you might want a scheduled job
  const cleanupThreshold = new Date()
  cleanupThreshold.setHours(cleanupThreshold.getHours() - 24)

  // Only clean up occasionally (10% of requests) to avoid overhead
  if (Math.random() < 0.1) {
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', cleanupThreshold.toISOString())
  }
}


/**
 * Build a same-origin redirect path under basePath without doubling `/goal`.
 * `next` should be an app-relative path like `/dashboard` or `/auth/reset`.
 */
export function safeNextPath(next: string | null, basePath: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return `${basePath}/dashboard`
  }

  // Already includes basePath (e.g. `/goal/auth/reset`) — do not prefix again.
  if (basePath && (next === basePath || next.startsWith(`${basePath}/`))) {
    return next
  }

  return `${basePath}${next}`
}

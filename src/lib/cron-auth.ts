/**
 * Shared authentication for scheduled / cron endpoints.
 *
 * Accepts:
 *   - Bearer token in Authorization header matching CRON_SECRET or ADMIN_SESSION_SECRET
 *   - X-Cron-Secret header matching CRON_SECRET or ADMIN_SESSION_SECRET
 */
export function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET
  if (!cronSecret) {
    // If neither secret is set in non-production, allow execution with warning
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token === cronSecret) return true
  }

  const xCronSecret = request.headers.get('x-cron-secret')
  if (xCronSecret && xCronSecret === cronSecret) {
    return true
  }

  return false
}
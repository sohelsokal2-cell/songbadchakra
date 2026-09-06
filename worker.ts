// @ts-nocheck
/**
 * Cloudflare Worker entry — wraps the OpenNext-generated worker
 * (`.open-next/worker.js`) and adds a `scheduled` handler so the hourly
 * Cron Trigger (`npx wrangler` reads `triggers.crons` in `wrangler.jsonc`)
 * actually executes the RSS ingestion + job-recovery cycle.
 *
 * The internal `fetch` is invoked in-process (no public network hop), so it
 * works even before the custom domain DNS is fully wired.
 *
 * Required production secret: `CRON_SECRET` (set via `wrangler secret put`).
 */
import worker from './.open-next/worker'

// Keep the OpenNext Durable Object exports intact (safe no-ops if unused).
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker'

export default {
  ...worker,

  async scheduled(_controller, env, ctx) {
    const secret = env.CRON_SECRET || env.ADMIN_SESSION_SECRET
    const headers = secret ? { 'x-cron-secret': secret } : {}
    const request = new Request('https://songbadchakra.internal/api/cron/rss', {
      method: 'POST',
      headers,
    })

    ctx.waitUntil(
      worker
        .fetch(request, env, ctx)
        .then((res) => {
          console.log(`[scheduled-rss] automation cycle finished with HTTP ${res.status}`)
        })
        .catch((err) => {
          console.error('[scheduled-rss] automation cycle failed:', err)
        })
    )
  },
}
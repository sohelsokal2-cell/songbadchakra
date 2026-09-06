/**
 * SongbadChakra — Job Recovery, Retry & Dead-Letter Runner
 *
 * Invokes the server-side recovery cycle (`/api/cron/recover`):
 *   - recovers jobs stuck in an in-progress state (lease timeout)
 *   - requeues retryable failures with exponential backoff
 *   - moves exhausted jobs to the dead-letter queue
 *   - re-runs ready queued jobs through the AI pipeline
 *
 * Usage:
 *   node scripts/recover-jobs.mjs
 *   node scripts/recover-jobs.mjs https://songbadchakra.com.bd
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// Load .env.local
try {
  const envContent = await fs.readFile(path.join(ROOT_DIR, '.env.local'), 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim()
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
} catch {
  // No .env.local, use process.env
}

const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || process.env.CRON_API_URL || 'http://localhost:3000'
const secret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET

if (!secret) {
  console.error('CRON_SECRET is not set. Add it to .env.local or the environment.')
  process.exit(1)
}

console.log(`🔁 Running job recovery cycle against ${baseUrl}...`)

const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cron/recover`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
  },
  cache: 'no-store',
})

const data = await res.json().catch(() => ({}))

if (!res.ok) {
  console.error(`❌ Recovery failed (HTTP ${res.status}):`, data.error || JSON.stringify(data))
  process.exit(1)
}

const r = data.recovery || {}
console.log('✅ Recovery cycle complete:')
console.log(`   recoveredStale:    ${r.recoveredStale ?? 0}`)
console.log(`   requeuedFailed:    ${r.requeuedFailed ?? 0}`)
console.log(`   deadLettered:      ${r.deadLettered ?? 0}`)
console.log(`   processedQueued:   ${r.processedQueued ?? 0}`)
console.log(`   succeeded:         ${r.succeeded ?? 0}`)
console.log(`   failed:            ${r.failed ?? 0}`)
console.log(`   deadLetterQueue:   ${r.deadLetterQueue ?? 0}`)
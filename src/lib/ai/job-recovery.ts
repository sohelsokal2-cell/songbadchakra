/**
 * Job Recovery, Retry & Dead-Letter Processor
 *
 * Runs as part of every automated cycle (GitHub scheduler, Cloudflare Cron
 * Trigger, manual admin run) to keep the AI pipeline self-healing:
 *
 *   1. recoverStaleJobs()       — jobs stuck in an in-progress state past their
 *                                 lease are requeued, or dead-lettered when
 *                                 `attempt >= max_attempts`.
 *   2. requeueFailedJobs()      — retryable failures (`status='failed'`) are
 *                                 requeued with exponential backoff.
 *   3. deadLetterExhaustedJobs()— any failed/retrying job past its retry budget
 *                                 is moved to `dead_letter` (never auto-retried).
 *   4. processQueuedJobs()      — queued jobs (lease ready) are re-run through
 *                                 the full pipeline reusing the SAME job record.
 *
 * Idempotent by design: leases + attempt counters prevent double execution.
 */

import type { NewsSource } from '@/types/news'
import type { AiJobStatus } from '@/types/ai'
import type { ParsedFeedItem } from '@/lib/rss-ingestion'
import { getAiJobById } from './ai-repository'
import { getSourceById } from '@/lib/news-repository'
import { runPipeline, DEFAULT_MAX_ATTEMPTS, IN_PROGRESS_JOB_STATUSES, LEASE_DURATION_MS } from './pipeline'
import { loadRuleConfig } from './rule-engine'

export { DEFAULT_MAX_ATTEMPTS, IN_PROGRESS_JOB_STATUSES }

// A job that has not updated its lease for this long (and has no lease bound)
// is considered crashed/stuck and eligible for recovery.
export const STALE_JOB_MINUTES = 30

// Exponential backoff base for retried failures (grows with attempt count).
export const RETRY_BACKOFF_MS = 5 * 60 * 1000

// Hard safety cap per recovery cycle.
export const RECOVERY_MAX_JOBS_PER_CYCLE = 20

export function isInProgressStatus(status: AiJobStatus): boolean {
  return IN_PROGRESS_JOB_STATUSES.includes(status)
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

interface SupabaseConfig {
  url: string
  headers: Record<string, string>
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}

/**
 * Thin fetch wrapper for PostgREST. Returns parsed JSON (or `true` for 204),
 * or `null` when Supabase is not configured or the request failed.
 */
async function supabaseRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${endpoint}`, {
      ...options,
      headers: { ...cfg.headers, ...(options?.headers || {}) },
      cache: 'no-store',
    })
    if (!res.ok) return null
    if (res.status === 204) return true as unknown as T
    const text = await res.text()
    return (text ? JSON.parse(text) : true) as T
  } catch (err) {
    console.warn(`[job-recovery] Supabase request failed: ${endpoint}`, err)
    return null
  }
}

function patchJob(id: string, data: Record<string, unknown>): Promise<boolean> {
  return supabaseRequest<boolean>(`ai_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { Prefer: 'return=minimal' },
  }).then((res) => res === true)
}

interface RecoverableJob {
  id: string
  sourceId?: string
  sourceUrl: string
  rawTitle?: string
  rawDescription?: string
  status: AiJobStatus
  attempt: number
  maxAttempts: number
  leaseExpiresAt?: string
  updatedAt: string
  error?: string
}

function mapRecoverableJob(r: Record<string, unknown>): RecoverableJob {
  return {
    id: String(r.id),
    sourceId: r.source_id ? String(r.source_id) : undefined,
    sourceUrl: String(r.source_url || ''),
    rawTitle: r.raw_title ? String(r.raw_title) : undefined,
    rawDescription: r.raw_description ? String(r.raw_description) : undefined,
    status: r.status as AiJobStatus,
    attempt: Number(r.attempt) > 0 ? Number(r.attempt) : 1,
    maxAttempts: Number(r.max_attempts) > 0 ? Number(r.max_attempts) : DEFAULT_MAX_ATTEMPTS,
    leaseExpiresAt: r.lease_expires_at ? String(r.lease_expires_at) : undefined,
    updatedAt: String(r.updated_at || new Date().toISOString()),
    error: r.error ? String(r.error) : undefined,
  }
}

async function fetchJobsByStatus(statuses: AiJobStatus[], limit = RECOVERY_MAX_JOBS_PER_CYCLE): Promise<RecoverableJob[]> {
  const rows = await supabaseRequest<Record<string, unknown>[]>(
    `ai_jobs?status=in.(${statuses.join(',')})&order=updated_at.asc&limit=${limit}`
  )
  if (!rows) return []
  return rows.map(mapRecoverableJob)
}

// ─── 1. Stale / lease-timeout recovery ─────────────────────────────────────────

export async function getStuckJobs(limit = RECOVERY_MAX_JOBS_PER_CYCLE): Promise<RecoverableJob[]> {
  const jobs = await fetchJobsByStatus(IN_PROGRESS_JOB_STATUSES, limit)
  const now = Date.now()
  const staleCutoff = now - STALE_JOB_MINUTES * 60 * 1000

  return jobs.filter((job) => {
    const lease = job.leaseExpiresAt ? new Date(job.leaseExpiresAt).getTime() : null
    if (lease !== null) return lease <= now // lease exists but has expired
    // No lease (pre-recovery jobs) — fall back to updated_at staleness check.
    const updated = new Date(job.updatedAt).getTime()
    return Number.isFinite(updated) && updated <= staleCutoff
  })
}

/**
 * Requeues jobs stuck in an in-progress state. Keeps the same attempt count
 * (a hang is not a completed attempt) unless the job is already at its limit.
 */
export async function recoverStaleJobs(limit = RECOVERY_MAX_JOBS_PER_CYCLE): Promise<number> {
  const stuck = await getStuckJobs(limit)
  const now = new Date().toISOString()
  let recovered = 0

  for (const job of stuck) {
    const note = (job.error ? `${job.error} | ` : '') + `[recovered @${now}] stuck in '${job.status}'`
    if (job.attempt >= job.maxAttempts) {
      await patchJob(job.id, {
        status: 'dead_letter',
        error: `[dead-lettered @${now}] ${note}`.slice(0, 1200),
        completed_at: now,
        updated_at: now,
        lease_expires_at: null,
      })
    } else {
      await patchJob(job.id, {
        status: 'queued',
        error: note.slice(0, 1200),
        started_at: null,
        completed_at: null,
        updated_at: now,
        lease_expires_at: null,
      })
      recovered++
    }
  }

  return recovered
}

// ─── 2. Retry failed jobs with backoff ─────────────────────────────────────────

export async function requeueFailedJobs(limit = RECOVERY_MAX_JOBS_PER_CYCLE): Promise<number> {
  const failed = await fetchJobsByStatus(['failed'], limit)
  const retryable = failed.filter((j) => j.attempt < j.maxAttempts)
  const now = new Date().toISOString()

  for (const job of retryable) {
    const backoffMs = RETRY_BACKOFF_MS * job.attempt // 5m, 10m, 15m…
    const note = (job.error ? `${job.error} | ` : '') + `[requeued @${now}] attempt ${job.attempt + 1}/${job.maxAttempts}`
    // The lease is set to the backoff deadline; processQueuedJobs skips queued
    // jobs whose lease is still in the future.
    await patchJob(job.id, {
      status: 'queued',
      attempt: job.attempt + 1,
      error: note.slice(0, 1200),
      started_at: null,
      completed_at: null,
      updated_at: now,
      lease_expires_at: new Date(Date.now() + backoffMs).toISOString(),
    })
  }

  return retryable.length
}

// ─── 3. Dead-letter (retry budget exhausted) ───────────────────────────────────

export async function deadLetterExhaustedJobs(limit = RECOVERY_MAX_JOBS_PER_CYCLE): Promise<number> {
  const exhausted = (await fetchJobsByStatus(['failed', 'retrying'], limit)).filter(
    (j) => j.attempt >= j.maxAttempts
  )
  const now = new Date().toISOString()

  for (const job of exhausted) {
    const note = (job.error ? `${job.error} | ` : '') + `[dead-lettered @${now}] attempts exhausted ${job.attempt}/${job.maxAttempts}`
    await patchJob(job.id, {
      status: 'dead_letter',
      error: note.slice(0, 1200),
      completed_at: now,
      updated_at: now,
      lease_expires_at: null,
    })
  }

  return exhausted.length
}

export async function countDeadLetterJobs(): Promise<number> {
  const rows = await supabaseRequest<Record<string, unknown>[]>('ai_jobs?status=eq.dead_letter&select=id&limit=1000')
  return rows ? rows.length : 0
}

// ─── 4. Process queued jobs (re-run through the pipeline) ─────────────────────

export function jobToFeedItem(job: RecoverableJob): ParsedFeedItem {
  return {
    title: job.rawTitle ?? '',
    link: job.sourceUrl,
    description: job.rawDescription ?? '',
    content: job.rawDescription,
  }
}

async function resolveSourceForJob(job: RecoverableJob): Promise<NewsSource | null> {
  if (job.sourceId) {
    const src = await getSourceById(job.sourceId).catch(() => null)
    if (src) return src
  }
  // Fallback: build a minimal source from the job URL so recovery never
  // depends on a source record that was deleted.
  try {
    const u = new URL(job.sourceUrl)
    const host = u.hostname.replace(/^www\./, '')
    return {
      id: job.sourceId ?? 'src-recovered',
      name: host || 'সংবাদচক্র',
      url: u.origin,
      feedUrl: u.origin,
      category: 'bangladesh',
      categoryLabel: 'বাংলাদেশ',
      isActive: true,
      fetchIntervalMinutes: 60,
      createdAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export interface QueuedResult {
  processed: number
  succeeded: number
  failed: number
  started: string[]
}

/**
 * Atomically claims a queued job so two concurrent schedulers (GitHub Actions
 * cron + Cloudflare scheduled trigger) can never run the same job twice.
 * Uses a PostgREST conditional PATCH: the row is only updated when it is STILL
 * `queued` AND its lease is absent or already expired. Returns true only when
 * this caller won the claim (the update matched exactly one row).
 */
export async function claimQueuedJob(id: string): Promise<boolean> {
  const nowIso = new Date().toISOString()
  // Small grace skew so a lease that is expiring "right now" is not double-claimed.
  const leaseCutoff = encodeURIComponent(new Date(Date.now() - 1000).toISOString())
  const endpoint =
    `ai_jobs?id=eq.${encodeURIComponent(id)}` +
    `&status=eq.queued` +
    `&or=(lease_expires_at.is.null,lease_expires_at.lte.${leaseCutoff})`
  const rows = await supabaseRequest<Record<string, unknown>[]>(endpoint, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'collecting',
      started_at: nowIso,
      updated_at: nowIso,
      lease_expires_at: new Date(Date.now() + LEASE_DURATION_MS).toISOString(),
    }),
  })
  return Array.isArray(rows) && rows.length > 0
}

export async function processQueuedJobs(limit?: number): Promise<QueuedResult> {
  const { getPipelineItemsPerRun } = await import('./pipeline')
  const ruleConfig = await loadRuleConfig()
  // Never exceed the per-invocation subrequest budget when auto-running.
  const batchSize = Math.max(
    1,
    Math.min(limit ?? Math.min(ruleConfig.maxItemsPerRun, getPipelineItemsPerRun()), RECOVERY_MAX_JOBS_PER_CYCLE)
  )
  const queued = await fetchJobsByStatus(['queued'], batchSize)
  // Only run jobs whose lease is absent or already expired (backoff honored).
  const ready = queued.filter((job) => {
    const lease = job.leaseExpiresAt ? new Date(job.leaseExpiresAt).getTime() : null
    return lease === null || lease <= Date.now()
  })

  const result: QueuedResult = { processed: 0, succeeded: 0, failed: 0, started: [] }

  for (const job of ready) {
    // Atomic claim first — skip silently if another scheduler instance won it.
    const claimed = await claimQueuedJob(job.id)
    if (!claimed) continue

    const source = await resolveSourceForJob(job)
    if (!source) {
      await patchJob(job.id, {
        status: 'dead_letter',
        error: '[dead-lettered] could not resolve a source for job URL.',
        completed_at: new Date().toISOString(),
        lease_expires_at: null,
      })
      continue
    }

    const pipeResult = await runPipeline(jobToFeedItem(job), source, { jobId: job.id })
    result.processed++
    result.started.push(job.id)
    if (pipeResult.status === 'failed' || pipeResult.status === 'dead_letter') {
      result.failed++
    } else if (
      pipeResult.status === 'published' ||
      pipeResult.status === 'held' ||
      pipeResult.status === 'rejected'
    ) {
      result.succeeded++
    }
  }

  return result
}

// ─── 5. Orchestrator + admin helpers ──────────────────────────────────────────

export interface AutomationCycleSummary {
  recoveredStale: number
  requeuedFailed: number
  deadLettered: number
  processedQueued: number
  succeeded: number
  failed: number
  deadLetterQueue: number
  timestamp: string
}

export interface AutomationCycleOptions {
  /**
   * Cap for queued jobs processed through the pipeline in this cycle. Used by
   * the cron route to share one subrequest budget between recovery+ingestion.
   */
  queuedLimit?: number
}

export async function runAutomationCycle(options?: AutomationCycleOptions): Promise<AutomationCycleSummary> {
  const recoveredStale = await recoverStaleJobs()
  const requeuedFailed = await requeueFailedJobs()
  const deadLettered = await deadLetterExhaustedJobs()
  const queuedRun = await processQueuedJobs(options?.queuedLimit)
  const deadLetterQueue = await countDeadLetterJobs()

  return {
    recoveredStale,
    requeuedFailed,
    deadLettered,
    processedQueued: queuedRun.processed,
    succeeded: queuedRun.succeeded,
    failed: queuedRun.failed,
    deadLetterQueue,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Admin action: replay a failed / retrying / dead-lettered job.
 * Dead-lettered jobs restart from attempt 1; others keep their attempt count.
 */
export async function requeueJob(jobId: string): Promise<boolean> {
  const job = await getAiJobById(jobId)
  if (!job) return false
  const now = new Date().toISOString()

  return patchJob(jobId, {
    status: 'queued',
    attempt: job.status === 'dead_letter' ? 1 : Math.max(job.attempt, 1),
    error: job.error ?? null,
    started_at: null,
    completed_at: null,
    updated_at: now,
    lease_expires_at: null,
  })
}
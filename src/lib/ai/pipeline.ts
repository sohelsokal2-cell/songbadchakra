/**
 * AI Pipeline Orchestrator
 *
 * Runs the full 6-role pipeline for a single news item:
 *   Collector → Writer → Fact Checker → Image Reviewer → SEO Reviewer → Duplicate Checker → Rule Engine → Publish
 *
 * Features:
 * - Tracks job state in ai_jobs table
 * - Logs each role execution in ai_pipeline_logs
 * - Failure in one article NEVER stops the batch
 * - Auto-publishes when Rule Engine returns PUBLISH
 * - Admin can override any decision afterward
 */

import type { AiJobStatus, AiPipelineLog, CollectorResult, WriterResult } from '@/types/ai'
import type { ParsedFeedItem } from '@/lib/rss-ingestion'
import type { NewsSource, NewsArticle } from '@/types/news'
import { generateSlug, sanitizeHtml } from '@/lib/rss-ingestion'
import { runCollector } from './roles/collector'
import { runWriter } from './roles/writer'
import { runFactChecker } from './roles/fact-checker'
import { runImageReviewer } from './roles/image-reviewer'
import { runSeoReviewer } from './roles/seo-reviewer'
import { runDuplicateChecker } from './roles/duplicate-checker'
import { evaluateRuleEngine, loadRuleConfig } from './rule-engine'

// ─── Job lifecycle constants ─────────────────────────────────────────────────
// A job's lease must be refreshed on every stage transition. Terminal states
// clear the lease. When a lease expires while the job is still in an in-progress
// state, the Recovery Cycle treats it as stuck and requeues/dead-letters it.
export const DEFAULT_MAX_ATTEMPTS = 3
export const LEASE_DURATION_MS = 20 * 60 * 1000

export const IN_PROGRESS_JOB_STATUSES: AiJobStatus[] = [
  'collecting', 'collected', 'writing', 'written',
  'fact_checking', 'fact_checked', 'image_reviewing', 'image_reviewed',
  'seo_reviewing', 'seo_reviewed', 'duplicate_checking', 'duplicate_checked',
  'rule_checking', 'retrying',
]

const TERMINAL_JOB_STATUSES: AiJobStatus[] = [
  'published', 'held', 'rejected', 'failed', 'dead_letter',
]

// ─── Supabase helpers ──────────────────────────────────────────────────────

function getSupabaseHeaders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return { url, key, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
}

async function supabasePatch(table: string, id: string, data: Record<string, unknown>) {
  const cfg = getSupabaseHeaders()
  if (!cfg) return
  await fetch(`${cfg.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...cfg.headers, Prefer: 'return=minimal' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })
}

async function supabaseInsert<T>(table: string, data: Record<string, unknown>): Promise<T | null> {
  const cfg = getSupabaseHeaders()
  if (!cfg) return null
  const res = await fetch(`${cfg.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...cfg.headers, Prefer: 'return=representation' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const rows = await res.json() as T[]
  return rows[0] ?? null
}

// ─── Job management ────────────────────────────────────────────────────────

async function createJob(
  source: NewsSource,
  item: ParsedFeedItem
): Promise<string | null> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const inserted = await supabaseInsert('ai_jobs', {
    id,
    source_id: source.id,
    source_url: item.link,
    raw_title: item.title?.slice(0, 500),
    raw_description: item.description?.slice(0, 1000),
    status: 'queued',
    attempt: 1,
    max_attempts: DEFAULT_MAX_ATTEMPTS,
    lease_expires_at: new Date(Date.now() + LEASE_DURATION_MS).toISOString(),
    created_at: now,
    updated_at: now,
    started_at: now,
  })
  return inserted ? id : null
}

async function updateJobStatus(jobId: string, status: AiJobStatus, extra: Record<string, unknown> = {}) {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  }
  // Refresh the lease on every in-progress transition; clear it on terminal states.
  if (IN_PROGRESS_JOB_STATUSES.includes(status)) {
    patch.lease_expires_at = new Date(Date.now() + LEASE_DURATION_MS).toISOString()
  } else if (TERMINAL_JOB_STATUSES.includes(status)) {
    patch.lease_expires_at = null
  }
  await supabasePatch('ai_jobs', jobId, patch)
}

/**
 * Reads the current attempt/max_attempts for a job (used by the failure handler
 * to decide between retry and dead-letter).
 */
async function getJobAttemptInfo(jobId: string): Promise<{ attempt: number; maxAttempts: number }> {
  const cfg = getSupabaseHeaders()
  if (!cfg) return { attempt: 1, maxAttempts: DEFAULT_MAX_ATTEMPTS }
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/ai_jobs?id=eq.${encodeURIComponent(jobId)}&select=attempt,max_attempts&limit=1`,
      { headers: cfg.headers, cache: 'no-store' }
    )
    if (res.ok) {
      const rows = await res.json() as Record<string, unknown>[]
      if (rows[0]) {
        return {
          attempt: Number(rows[0].attempt) > 0 ? Number(rows[0].attempt) : 1,
          maxAttempts: Number(rows[0].max_attempts) > 0 ? Number(rows[0].max_attempts) : DEFAULT_MAX_ATTEMPTS,
        }
      }
    }
  } catch {
    // fall through to defaults
  }
  return { attempt: 1, maxAttempts: DEFAULT_MAX_ATTEMPTS }
}

async function createPipelineLog(log: Omit<AiPipelineLog, 'id' | 'createdAt'>) {
  await supabaseInsert('ai_pipeline_logs', {
    id: crypto.randomUUID(),
    job_id: log.jobId,
    role: log.role,
    provider: log.provider ?? null,
    model: log.model ?? null,
    api_key_label: log.apiKeyLabel ?? null,
    status: log.status,
    score: log.score ?? null,
    decision: log.decision ?? null,
    attempt: log.attempt,
    prompt_tokens: log.promptTokens ?? null,
    completion_tokens: log.completionTokens ?? null,
    latency_ms: log.latencyMs ?? null,
    error: log.error ?? null,
    created_at: new Date().toISOString(),
  })
}

// ─── Article publication ───────────────────────────────────────────────────

async function publishArticle(
  jobId: string,
  collected: CollectorResult,
  written: WriterResult,
  imageUrl: string | undefined,
  source: NewsSource,
  sourceItem: ParsedFeedItem,
  status: 'published' | 'draft' = 'published'
): Promise<string | null> {
  const cfg = getSupabaseHeaders()
  if (!cfg) {
    // Fallback: use existing news-repository createArticle
    const { createArticle } = await import('@/lib/news-repository')
    const article: Omit<NewsArticle, 'id'> = {
      title: written.headline,
      slug: written.slug || generateSlug(written.headline),
      summary: written.summary,
      content: sanitizeHtml(written.body),
      category: written.category,
      categoryLabel: written.categoryLabel,
      sourceName: source.name,
      sourceUrl: collected.originalUrl,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      publishedAt: collected.pubDate || new Date().toISOString(),
      isBreaking: false,
      status,
      author: {
        name: `${source.name} (AI সংকলিত)`,
        title: 'সংবাদচক্র অটোমেশন ডেস্ক',
      },
      readingTime: written.readingTime,
      tags: written.tags,
    }
    try {
      const created = await createArticle(article)
      return created.id
    } catch {
      return null
    }
  }

  // Publish directly via Supabase REST
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const slug = written.slug || generateSlug(written.headline)
  const articleData = {
    id,
    title: written.headline,
    slug,
    summary: written.summary,
    content: sanitizeHtml(written.body),
    category: written.category,
    category_label: written.categoryLabel,
    source_name: source.name,
    source_url: collected.originalUrl,
    image_url: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    published_at: collected.pubDate || now,
    is_breaking: false,
    status,
    author: {
      name: `${source.name} (AI সংকলিত)`,
      title: 'সংবাদচক্র অটোমেশন ডেস্ক',
    },
    reading_time: written.readingTime,
    tags: written.tags,
    ai_job_id: jobId,
  }

  const res = await fetch(`${cfg.url}/rest/v1/articles`, {
    method: 'POST',
    headers: { ...cfg.headers, Prefer: 'return=representation' },
    body: JSON.stringify(articleData),
    cache: 'no-store',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    // Handle duplicate slug error
    if (errText.includes('duplicate') || errText.includes('unique')) {
      const retryData = { ...articleData, slug: `${slug}-${Date.now().toString(36)}` }
      const retryRes = await fetch(`${cfg.url}/rest/v1/articles`, {
        method: 'POST',
        headers: { ...cfg.headers, Prefer: 'return=representation' },
        body: JSON.stringify(retryData),
        cache: 'no-store',
      })
      if (retryRes.ok) {
        const rows = await retryRes.json() as Record<string, unknown>[]
        return rows[0]?.id ? String(rows[0].id) : null
      }
    }
    return null
  }

  const rows = await res.json() as Record<string, unknown>[]
  return rows[0]?.id ? String(rows[0].id) : null
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────

export interface PipelineResult {
  jobId: string
  sourceUrl: string
  status: AiJobStatus
  articleId?: string
  decision?: string
  reasons?: string[]
  error?: string
  attempt?: number
  maxAttempts?: number
}

/**
 * Run the full AI pipeline for one RSS feed item.
 * Does NOT throw — captures all errors and returns a result object.
 *
 * When `options.jobId` is provided the pipeline reuses that existing ai_jobs
 * record (used by the Recovery Cycle to re-run failed/stuck jobs).
 */
export async function runPipeline(
  item: ParsedFeedItem,
  source: NewsSource,
  options: { jobId?: string } = {}
): Promise<PipelineResult> {
  // Reuse the existing job (retry/recovery path) or create a fresh one.
  // If the ai_jobs insert fails (no Supabase configured) fall back to a UUID
  // so the rest of the pipeline is still observable via logs.
  const jobId = options.jobId ?? (await createJob(source, item).catch(() => null)) ?? crypto.randomUUID()

  try {
    const config = await loadRuleConfig()

    // ── Stage 1: Collector ─────────────────────────────────────────────────
    await updateJobStatus(jobId, 'collecting')
    const collected = runCollector(item, source)
    await createPipelineLog({
      jobId, role: 'collector', status: collected.status === 'PASS' ? 'success' : 'failed',
      decision: collected.status, attempt: 1,
    })
    if (collected.status === 'FAIL') {
      await updateJobStatus(jobId, 'rejected', {
        collector_result: collected,
        reject_reason: `Collector FAIL: ${collected.issues.join('; ')}`,
        completed_at: new Date().toISOString(),
      })
      return { jobId, sourceUrl: item.link, status: 'rejected', error: collected.issues.join('; ') }
    }
    await updateJobStatus(jobId, 'collected', { collector_result: collected })

    // ── Stage 2: Writer ────────────────────────────────────────────────────
    await updateJobStatus(jobId, 'writing')
    const written = await runWriter(collected)
    await createPipelineLog({
      jobId, role: 'writer', provider: written.provider, model: written.model,
      status: written.status === 'PASS' ? 'success' : 'failed',
      score: written.score, decision: written.status,
      promptTokens: written.promptTokens, completionTokens: written.completionTokens,
      latencyMs: written.latencyMs, attempt: 1,
    })
    if (written.status === 'FAIL') {
      await updateJobStatus(jobId, 'rejected', {
        writer_result: written,
        reject_reason: `Writer FAIL: ${written.issues.join('; ')}`,
        completed_at: new Date().toISOString(),
      })
      return { jobId, sourceUrl: item.link, status: 'rejected', error: written.issues.join('; ') }
    }
    await updateJobStatus(jobId, 'written', { writer_result: written })

    // ── Stage 3: Fact Checker ──────────────────────────────────────────────
    await updateJobStatus(jobId, 'fact_checking')
    const factChecked = await runFactChecker(written, collected, config.factCheckerMin)
    await createPipelineLog({
      jobId, role: 'fact_checker', provider: factChecked.provider, model: factChecked.model,
      status: factChecked.status === 'PASS' ? 'success' : 'failed',
      score: factChecked.score, decision: factChecked.decision,
      promptTokens: factChecked.promptTokens, completionTokens: factChecked.completionTokens,
      latencyMs: factChecked.latencyMs, attempt: 1,
    })
    await updateJobStatus(jobId, 'fact_checked', { fact_checker_result: factChecked })

    // ── Stage 4: Image Reviewer ────────────────────────────────────────────
    await updateJobStatus(jobId, 'image_reviewing')
    const imageReviewed = await runImageReviewer(collected, written, config.imageMin)
    await createPipelineLog({
      jobId, role: 'image_reviewer', provider: imageReviewed.provider,
      status: imageReviewed.status === 'PASS' ? 'success' : 'failed',
      score: imageReviewed.score, decision: imageReviewed.decision,
      latencyMs: imageReviewed.latencyMs, attempt: 1,
    })
    await updateJobStatus(jobId, 'image_reviewed', { image_reviewer_result: imageReviewed })

    // ── Stage 5: SEO Reviewer ──────────────────────────────────────────────
    await updateJobStatus(jobId, 'seo_reviewing')
    const seoReviewed = await runSeoReviewer(written, config.seoMin)
    await createPipelineLog({
      jobId, role: 'seo_reviewer', provider: seoReviewed.provider, model: seoReviewed.model,
      status: seoReviewed.status === 'PASS' ? 'success' : 'failed',
      score: seoReviewed.score, decision: seoReviewed.decision,
      promptTokens: seoReviewed.promptTokens, completionTokens: seoReviewed.completionTokens,
      latencyMs: seoReviewed.latencyMs, attempt: 1,
    })
    await updateJobStatus(jobId, 'seo_reviewed', { seo_reviewer_result: seoReviewed })

    // ── Stage 6: Duplicate Checker ─────────────────────────────────────────
    await updateJobStatus(jobId, 'duplicate_checking')
    const dupChecked = await runDuplicateChecker(collected, written)
    await createPipelineLog({
      jobId, role: 'duplicate_checker',
      status: dupChecked.status === 'PASS' ? 'success' : 'failed',
      score: dupChecked.similarity, decision: dupChecked.decision,
      latencyMs: dupChecked.latencyMs, attempt: 1,
    })
    await updateJobStatus(jobId, 'duplicate_checked', { duplicate_checker_result: dupChecked })

    // ── Stage 7: Rule Engine ───────────────────────────────────────────────
    await updateJobStatus(jobId, 'rule_checking')
    const ruleResult = evaluateRuleEngine({
      collector: collected,
      writer: written,
      factChecker: factChecked,
      imageReviewer: imageReviewed,
      seoReviewer: seoReviewed,
      duplicateChecker: dupChecked,
      config,
    })

    // ── Stage 8: Act on Rule Engine decision ───────────────────────────────
    if (ruleResult.decision === 'PUBLISH') {
      // Never attach an image that failed the Image Reviewer threshold.
      const approvedImageUrl = ruleResult.imageApproved ? imageReviewed.approvedImageUrl : undefined
      const articleId = await publishArticle(jobId, collected, written, approvedImageUrl, source, item, 'published')

      if (!articleId) {
        // Database insert failed — the job must NOT be marked published.
        await updateJobStatus(jobId, 'failed', {
          rule_engine_result: ruleResult,
          error: 'Article insert failed — job NOT marked published (recovery cycle will requeue).',
          completed_at: new Date().toISOString(),
        })
        return {
          jobId,
          sourceUrl: item.link,
          status: 'failed',
          decision: 'PUBLISH',
          error: 'Article insert failed (no article id returned).',
        }
      }

      await updateJobStatus(jobId, 'published', {
        rule_engine_result: ruleResult,
        article_id: articleId,
        completed_at: new Date().toISOString(),
      })

      return {
        jobId,
        sourceUrl: item.link,
        status: 'published',
        articleId,
        decision: 'PUBLISH',
        reasons: ruleResult.reasons,
      }
    } else if (ruleResult.decision === 'HOLD') {
      const approvedImageUrl = ruleResult.imageApproved ? imageReviewed.approvedImageUrl : undefined
      const articleId = await publishArticle(jobId, collected, written, approvedImageUrl, source, item, 'draft')

      if (!articleId) {
        // Draft insert failed — job must NOT be marked held with no article.
        await updateJobStatus(jobId, 'failed', {
          rule_engine_result: ruleResult,
          error: 'Draft insert failed — job NOT marked held (recovery cycle will requeue).',
          completed_at: new Date().toISOString(),
        })
        return {
          jobId,
          sourceUrl: item.link,
          status: 'failed',
          decision: 'HOLD',
          error: 'Draft insert failed (no article id returned).',
        }
      }

      await updateJobStatus(jobId, 'held', {
        rule_engine_result: ruleResult,
        article_id: articleId,
        hold_reason: ruleResult.reasons.join('; '),
        completed_at: new Date().toISOString(),
      })
      return {
        jobId,
        sourceUrl: item.link,
        status: 'held',
        articleId,
        decision: 'HOLD',
        reasons: ruleResult.reasons,
      }
    } else {
      await updateJobStatus(jobId, 'rejected', {
        rule_engine_result: ruleResult,
        reject_reason: ruleResult.reasons.join('; '),
        completed_at: new Date().toISOString(),
      })
      return {
        jobId,
        sourceUrl: item.link,
        status: 'rejected',
        decision: 'REJECT',
        reasons: ruleResult.reasons,
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const { attempt, maxAttempts } = await getJobAttemptInfo(jobId)

    // ── Job-level retry: leave a retryable failure as 'failed'. The Recovery
    //    Cycle requeues it with exponential backoff until maxAttempts is hit.
    if (attempt < maxAttempts) {
      await updateJobStatus(jobId, 'failed', {
        error: `[attempt ${attempt}/${maxAttempts}] ${errMsg.slice(0, 900)}`,
        completed_at: new Date().toISOString(),
      }).catch(() => undefined)
      return { jobId, sourceUrl: item.link, status: 'failed', error: errMsg, attempt, maxAttempts }
    }

    // ── Dead-letter: all attempts exhausted — never auto-retry again.
    await updateJobStatus(jobId, 'dead_letter', {
      error: `[dead-lettered after ${attempt}/${maxAttempts} attempts] ${errMsg.slice(0, 900)}`,
      completed_at: new Date().toISOString(),
    }).catch(() => undefined)
    return { jobId, sourceUrl: item.link, status: 'dead_letter', error: errMsg, attempt, maxAttempts }
  }
}

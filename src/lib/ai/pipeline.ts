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
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await supabaseInsert('ai_jobs', {
    id,
    source_id: source.id,
    source_url: item.link,
    raw_title: item.title?.slice(0, 500),
    raw_description: item.description?.slice(0, 1000),
    status: 'queued',
    attempt: 1,
    created_at: now,
    updated_at: now,
    started_at: now,
  })
  return id
}

async function updateJobStatus(jobId: string, status: AiJobStatus, extra: Record<string, unknown> = {}) {
  await supabasePatch('ai_jobs', jobId, {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  })
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
}

/**
 * Run the full AI pipeline for one RSS feed item.
 * Does NOT throw — captures all errors and returns a result object.
 */
export async function runPipeline(
  item: ParsedFeedItem,
  source: NewsSource
): Promise<PipelineResult> {
  // Create job record
  const jobId = await createJob(source, item).catch(() => crypto.randomUUID())

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
      const approvedImageUrl = imageReviewed.approvedImageUrl
      const articleId = await publishArticle(jobId, collected, written, approvedImageUrl, source, item, 'published')

      await updateJobStatus(jobId, 'published', {
        rule_engine_result: ruleResult,
        article_id: articleId,
        completed_at: new Date().toISOString(),
      })

      return {
        jobId,
        sourceUrl: item.link,
        status: 'published',
        articleId: articleId ?? undefined,
        decision: 'PUBLISH',
        reasons: ruleResult.reasons,
      }
    } else if (ruleResult.decision === 'HOLD') {
      const approvedImageUrl = imageReviewed.approvedImageUrl
      const articleId = await publishArticle(jobId, collected, written, approvedImageUrl, source, item, 'draft')

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
        articleId: articleId ?? undefined,
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
    await updateJobStatus(jobId, 'failed', {
      error: errMsg.slice(0, 1000),
      completed_at: new Date().toISOString(),
    }).catch(() => undefined)
    return { jobId, sourceUrl: item.link, status: 'failed', error: errMsg }
  }
}

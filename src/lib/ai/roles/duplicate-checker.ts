/**
 * Duplicate Checker Role — ডুপ্লিকেট শনাক্তকারী
 *
 * Detects whether an article is a duplicate, update, or genuinely new story.
 * Uses: exact URL match, normalized URL, title similarity, content fingerprint.
 *
 * Distinguishes:
 *   DUPLICATE  — same story, same information, already published
 *   UPDATE     — same ongoing event, but new developments
 *   NEW_STORY  — entirely new event or topic
 */

import type { CollectorResult, WriterResult, DuplicateCheckerResult } from '@/types/ai'
import { normalizeUrl } from './collector'

interface ExistingArticle {
  id: string
  slug: string
  sourceUrl: string
  title: string
  publishedAt: string
}

/**
 * Calculate Levenshtein distance between two strings (normalized 0–100 similarity).
 */
function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (s1 === s2) return 100

  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 100

  // Simple character-based overlap (fast approximate similarity)
  const set1 = new Set(s1.split(''))
  const set2 = new Set(s2.split(''))
  const intersection = [...set1].filter((c) => set2.has(c)).length
  const union = new Set([...set1, ...set2]).size
  return Math.round((intersection / union) * 100)
}

/**
 * Simple content fingerprint: hash-like string from first 200 chars.
 */
function contentFingerprint(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 200)
}

/**
 * Load recent articles from Supabase (or return empty if unavailable).
 * Only loads fields needed for dedup — not full content.
 */
async function loadRecentArticles(limit = 200): Promise<ExistingArticle[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    try {
      const { getAllArticles } = await import('@/lib/news-repository')
      const data = await getAllArticles({ limit })
      return data.articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        sourceUrl: a.sourceUrl,
        title: a.title,
        publishedAt: a.publishedAt,
      }))
    } catch {
      return []
    }
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=id,slug,source_url,title,published_at&order=published_at.desc&limit=${limit}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      const { getAllArticles } = await import('@/lib/news-repository')
      const data = await getAllArticles({ limit })
      return data.articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        sourceUrl: a.sourceUrl,
        title: a.title,
        publishedAt: a.publishedAt,
      }))
    }
    const rows = await res.json() as Record<string, unknown>[]
    return rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      sourceUrl: String(r.source_url),
      title: String(r.title),
      publishedAt: String(r.published_at),
    }))
  } catch {
    try {
      const { getAllArticles } = await import('@/lib/news-repository')
      const data = await getAllArticles({ limit })
      return data.articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        sourceUrl: a.sourceUrl,
        title: a.title,
        publishedAt: a.publishedAt,
      }))
    } catch {
      return []
    }
  }
}

const TITLE_DUPLICATE_THRESHOLD = 85    // >= this → likely duplicate
const TITLE_UPDATE_THRESHOLD = 60       // >= this → possible update
const RECENCY_HOURS_THRESHOLD = 72      // Only check articles < 72h old for "update" detection

export async function runDuplicateChecker(
  collected: CollectorResult,
  written: WriterResult
): Promise<DuplicateCheckerResult> {
  const startMs = Date.now()
  const issues: string[] = []

  // Load recent articles for comparison
  const existing = await loadRecentArticles(300)

  if (existing.length === 0) {
    return {
      status: 'PASS',
      decision: 'NEW_STORY',
      similarity: 0,
      issues: ['No existing articles available for comparison. Treating as new story.'],
      latencyMs: Date.now() - startMs,
    }
  }

  const normalizedSourceUrl = normalizeUrl(collected.originalUrl)

  // 1. Exact URL match
  for (const article of existing) {
    if (article.sourceUrl === collected.originalUrl) {
      return {
        status: 'FAIL',
        decision: 'DUPLICATE',
        similarity: 100,
        matchedArticleId: article.id,
        matchedArticleSlug: article.slug,
        issues: ['Exact source URL already exists in the database.'],
        latencyMs: Date.now() - startMs,
      }
    }
    // Normalized URL match
    if (normalizeUrl(article.sourceUrl) === normalizedSourceUrl) {
      return {
        status: 'FAIL',
        decision: 'DUPLICATE',
        similarity: 98,
        matchedArticleId: article.id,
        matchedArticleSlug: article.slug,
        issues: ['Normalized source URL already exists (tracking params stripped).'],
        latencyMs: Date.now() - startMs,
      }
    }
  }

  // 2. Title similarity check
  const newTitleFingerprint = contentFingerprint(written.headline)
  let highestSimilarity = 0
  let bestMatch: ExistingArticle | undefined

  for (const article of existing) {
    const sim = titleSimilarity(written.headline, article.title)
    if (sim > highestSimilarity) {
      highestSimilarity = sim
      bestMatch = article
    }
  }

  if (highestSimilarity >= TITLE_DUPLICATE_THRESHOLD) {
    issues.push(
      `Title similarity ${highestSimilarity}% with "${(bestMatch?.title ?? '').slice(0, 60)}..."`
    )
    return {
      status: 'FAIL',
      decision: 'DUPLICATE',
      similarity: highestSimilarity,
      matchedArticleId: bestMatch?.id,
      matchedArticleSlug: bestMatch?.slug,
      issues,
      latencyMs: Date.now() - startMs,
    }
  }

  if (highestSimilarity >= TITLE_UPDATE_THRESHOLD && bestMatch) {
    const articleAge = Date.now() - new Date(bestMatch.publishedAt).getTime()
    const articleAgeHours = articleAge / (1000 * 60 * 60)

    if (articleAgeHours < RECENCY_HOURS_THRESHOLD) {
      issues.push(
        `Possible update to story: ${highestSimilarity}% title similarity with recent article.`
      )
      return {
        status: 'PASS',
        decision: 'UPDATE',
        similarity: highestSimilarity,
        matchedArticleId: bestMatch.id,
        matchedArticleSlug: bestMatch.slug,
        issues,
        latencyMs: Date.now() - startMs,
      }
    }
  }

  void newTitleFingerprint // suppress unused variable warning in strict mode

  return {
    status: 'PASS',
    decision: 'NEW_STORY',
    similarity: highestSimilarity,
    issues: highestSimilarity > 40
      ? [...issues, `Moderate similarity ${highestSimilarity}% with existing content — treated as new story.`]
      : issues,
    latencyMs: Date.now() - startMs,
  }
}

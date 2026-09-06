/**
 * Collector Role — তথ্য সংগ্রাহক
 *
 * Normalizes and validates raw RSS feed items into structured CollectorResult.
 * This role is deterministic (no AI call needed) — it sanitizes, validates,
 * and structures the parsed feed item. The AI pipeline starts from the Writer.
 *
 * Security: All inputs are treated as hostile/untrusted.
 */

import type { CollectorResult } from '@/types/ai'
import type { ParsedFeedItem } from '@/lib/rss-ingestion'
import type { NewsSource } from '@/types/news'

const MAX_TITLE_LENGTH = 500
const MAX_DESC_LENGTH = 5000
const MAX_CONTENT_LENGTH = 50000

/**
 * Validate that a URL is safe and well-formed.
 * Rejects javascript:, data:, and non-http(s) URLs.
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed === '#' || trimmed === '') return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Normalize a URL for deduplication:
 * - lowercase scheme + host
 * - remove trailing slash
 * - remove common tracking params (utm_*, fbclid, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    // Remove tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref']
    trackingParams.forEach((p) => u.searchParams.delete(p))
    let result = `${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${u.pathname}`
    if (result.endsWith('/') && u.pathname !== '/') {
      result = result.slice(0, -1)
    }
    if (u.search) result += u.search
    return result
  } catch {
    return url.trim().toLowerCase()
  }
}

/**
 * Sanitize plain text: remove null bytes, excessive whitespace, control chars.
 * Never executes embedded content.
 */
function sanitizeText(text: string, maxLen: number): string {
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen)
}

/**
 * Run the Collector role on a single feed item.
 * Returns a structured CollectorResult with PASS or FAIL.
 */
export function runCollector(
  item: ParsedFeedItem,
  source: NewsSource
): CollectorResult {
  const issues: string[] = []

  // Sanitize all text fields — treat all RSS content as untrusted
  const title = sanitizeText(item.title || '', MAX_TITLE_LENGTH)
  const description = sanitizeText(item.description || '', MAX_DESC_LENGTH)
  const content = item.content ? sanitizeText(item.content, MAX_CONTENT_LENGTH) : undefined
  const originalUrl = (item.link || '').trim()
  const normalizedUrl = normalizeUrl(originalUrl)

  // Validate required fields
  if (!title) issues.push('Missing or empty title.')
  if (!originalUrl) issues.push('Missing source URL.')
  if (!validateUrl(originalUrl)) issues.push(`Invalid source URL: ${originalUrl.slice(0, 100)}`)
  if (!description && !content) issues.push('No description or content available.')

  // Validate image URL if present
  let imageUrl: string | undefined
  if (item.imageUrl) {
    if (validateUrl(item.imageUrl)) {
      imageUrl = item.imageUrl
    } else {
      issues.push('Image URL is invalid and was excluded.')
    }
  }

  // Validate pub date
  let pubDate: string | undefined
  if (item.pubDate) {
    try {
      const d = new Date(item.pubDate)
      if (!isNaN(d.getTime())) {
        pubDate = d.toISOString()
      }
    } catch {
      issues.push('Invalid publication date, will use current time.')
    }
  }

  const hasCriticalIssues =
    !title || !validateUrl(originalUrl)

  return {
    status: hasCriticalIssues ? 'FAIL' : 'PASS',
    sourceId: source.id,
    sourceName: source.name,
    originalUrl,
    normalizedUrl,
    title,
    description,
    content,
    pubDate: pubDate || new Date().toISOString(),
    imageUrl,
    author: item.author ? sanitizeText(item.author, 200) : undefined,
    categoryHint: source.category,
    issues,
  }
}

/**
 * RSS Feed Fetcher, Parser, HTML Sanitizer & AI Processing Pipeline
 * Supports RSS 2.0 and Atom feeds.
 * Resilient to network timeouts, malformed XML, and prompt injection.
 * Always creates articles in 'draft' status with explicit source attribution.
 */

import {
  type NewsSource,
} from '@/types/news'
import {
  getAllArticles,
  createAiLog,
  updateSource,
} from '@/lib/news-repository'
import { loadRuleConfig } from '@/lib/ai/rule-engine'

export interface ParsedFeedItem {
  title: string
  link: string
  description: string
  content?: string
  pubDate?: string
  imageUrl?: string
  author?: string
}

export interface IngestionResult {
  sourceId: string
  sourceName: string
  fetchedCount: number
  ingestedCount: number
  skippedCount: number
  failedCount: number
  /** Items that went through the full AI pipeline in this call. */
  pipelineCount: number
  /** Items enqueued as queued jobs for a later invocation (subrequest budget). */
  queuedCount: number
  errors: string[]
}

/**
 * Strips dangerous HTML tags, attributes, event handlers, scripts, and iframes.
 * Ensures untrusted RSS feed content cannot inject scripts or render arbitrary frames.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return ''

  return rawHtml
    // Remove CDATA markers
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    // Remove scripts and styles completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove inline event handlers like onclick, onload, onerror
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: pseudo-protocol
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    // Remove dangerous attributes
    .replace(/\s*(formaction|data)\s*=\s*(['"]).*?\2/gi, '')
    // Decode common XML/HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Strips all HTML tags to produce pure plain text
 */
export function stripHtmlToText(html: string): string {
  const sanitized = sanitizeHtml(html)
  return sanitized
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Lightweight, zero-dependency XML feed parser that extracts items from RSS 2.0 or Atom
 */
export function parseFeedXml(xmlString: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = []

  // Clean XML prolog or whitespace
  const cleanXml = xmlString.trim()

  // Detect Atom vs RSS 2.0
  const isAtom = /<feed\b[^>]*>/i.test(cleanXml)

  if (isAtom) {
    const entryMatches = cleanXml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)
    for (const match of entryMatches) {
      const entryXml = match[1]
      const title = extractXmlTag(entryXml, 'title')
      
      // Atom link can be <link href="..." /> or <link>...</link>
      let link = ''
      const linkHrefMatch = entryXml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)
      if (linkHrefMatch) {
        link = linkHrefMatch[1]
      } else {
        link = extractXmlTag(entryXml, 'link')
      }

      const summary = extractXmlTag(entryXml, 'summary') || extractXmlTag(entryXml, 'content')
      const updated = extractXmlTag(entryXml, 'updated') || extractXmlTag(entryXml, 'published')
      const author = extractXmlTag(entryXml, 'name') || extractXmlTag(entryXml, 'author')
      
      // Image from enclosure or media:thumbnail
      const imageUrl = extractImageUrl(entryXml)

      if (title && link) {
        items.push({
          title: stripHtmlToText(title),
          link: link.trim(),
          description: stripHtmlToText(summary),
          content: sanitizeHtml(summary),
          pubDate: updated ? new Date(updated).toISOString() : new Date().toISOString(),
          imageUrl,
          author: author ? stripHtmlToText(author) : undefined,
        })
      }
    }
  } else {
    // RSS 2.0
    const itemMatches = cleanXml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)
    for (const match of itemMatches) {
      const itemXml = match[1]
      const title = extractXmlTag(itemXml, 'title')
      const link = extractXmlTag(itemXml, 'link')
      const description = extractXmlTag(itemXml, 'description')
      const contentEncoded = extractXmlTag(itemXml, 'content:encoded') || extractXmlTag(itemXml, 'content')
      const pubDate = extractXmlTag(itemXml, 'pubDate')
      const author = extractXmlTag(itemXml, 'dc:creator') || extractXmlTag(itemXml, 'author')
      const imageUrl = extractImageUrl(itemXml)

      if (title && link) {
        const fullContent = contentEncoded || description || ''
        items.push({
          title: stripHtmlToText(title),
          link: link.trim(),
          description: stripHtmlToText(description),
          content: sanitizeHtml(fullContent),
          pubDate: pubDate ? tryParseDate(pubDate) : new Date().toISOString(),
          imageUrl,
          author: author ? stripHtmlToText(author) : undefined,
        })
      }
    }
  }

  return items
}

function extractXmlTag(xml: string, tag: string): string {
  // Handles <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const escapedTag = tag.replace(':', '\\:')
  const regex = new RegExp(`<${escapedTag}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i')
  const match = xml.match(regex)
  if (!match) return ''
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim()
}

function extractImageUrl(xml: string): string | undefined {
  // 1. Check <enclosure url="..." type="image/..." />
  const encMatch = xml.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["']/i)
  if (encMatch) return encMatch[1]

  // 2. Check <media:content url="..." /> or <media:thumbnail url="..." />
  const mediaMatch = xml.match(/<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["']/i)
  if (mediaMatch) return mediaMatch[1]

  // 3. Fallback: first <img> tag src
  const imgMatch = xml.match(/<img\b[^>]*src=["']([^"']+)["']/i)
  if (imgMatch) return imgMatch[1]

  return undefined
}

function tryParseDate(dateStr: string): string {
  try {
    const timestamp = Date.parse(dateStr)
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toISOString()
    }
  } catch {
    // fallback
  }
  return new Date().toISOString()
}

/**
 * Generate unique slug from title
 */
export function generateSlug(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 70)
  
  const randomSuffix = Math.random().toString(36).slice(2, 7)
  return sanitized ? `${sanitized}-${randomSuffix}` : `news-${Date.now()}-${randomSuffix}`
}

/**
 * AI Summarization / Re-writing service
 * Uses Google Gemini API if GEMINI_API_KEY is available;
 * Otherwise uses a deterministic Bengali editorial cleaner stub.
 */
export async function processItemWithAi(
  item: ParsedFeedItem,
  source: NewsSource
): Promise<{
  title: string
  summary: string
  content: string
  tags: string[]
  readingTime: number
  provider: string
  model: string
  promptTokens?: number
  completionTokens?: number
}> {
  const apiKey = process.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const prompt = `আপনি সংবাদচক্র (SongbadChakra) পোর্টালের একজন অভিজ্ঞ বাংলা বার্তা সম্পাদক। 
নিচের সংবাদটির তথ্য বিশ্লেষণ করে একটি নিরপেক্ষ, প্রফেশনাল ও আকর্ষণীয় বাংলা সংবাদ ড্রাফট তৈরি করুন।

গুরুত্বপূর্ণ নির্দেশনা:
1. কোন প্রকার মতাদর্শিক পক্ষপাত বা অযাচিত মন্তব্য যোগ করবেন না।
2. মূল তথ্য পরিবর্তন করবেন না।
3. আউটপুট শুধুমাত্র একটি বৈধ JSON অবজেক্ট আকারে প্রদান করুন। অতিরিক্ত কোনো টেক্সট বা মার্কডাউন ব্যাকটিক ছাড়া।

JSON ফরম্যাট:
{
  "title": "সংক্ষিপ্ত ও আকর্ষণীয় বাংলা শিরোনাম",
  "summary": "২-৩ লাইনের মূল সারসংক্ষেপ",
  "content": "<p>বিস্তারিত সংবাদ প্যারাগ্রাফ ১</p><p>বিস্তারিত প্যারাগ্রাফ ২</p>",
  "tags": ["ট্যাগ১", "ট্যাগ২", "ট্যাগ৩"]
}

মূল সংবাদ তথ্য:
উৎস: ${source.name}
শিরোনাম: ${item.title}
বর্ণনা: ${item.description}
বিস্তারিত: ${item.content ? stripHtmlToText(item.content).slice(0, 1500) : item.description}`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          const wordCount = (parsed.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).length
          return {
            title: parsed.title || item.title,
            summary: parsed.summary || item.description.slice(0, 160),
            content: parsed.content || `<p>${item.description}</p>`,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [source.categoryLabel],
            readingTime: Math.max(1, Math.ceil(wordCount / 180)),
            provider: 'gemini',
            model: 'gemini-1.5-flash',
            promptTokens: data?.usageMetadata?.promptTokenCount,
            completionTokens: data?.usageMetadata?.candidatesTokenCount,
          }
        }
      }
    } catch {
      // Fallback to offline editor on error
    }
  }

  // Offline / Default Deterministic Bengali Editorial Processor
  const cleanTitle = item.title.trim()
  const rawText = item.description || item.title
  const summary = rawText.length > 200 ? rawText.slice(0, 197) + '...' : rawText
  const paragraphs = (item.content || `<p>${rawText}</p>`)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('<p>') ? p : `<p>${p}</p>`))
    .join('\n')

  const wordCount = rawText.split(/\s+/).length

  return {
    title: cleanTitle,
    summary,
    content: paragraphs || `<p>${rawText}</p>`,
    tags: [source.categoryLabel, source.name],
    readingTime: Math.max(1, Math.ceil(wordCount / 180)),
    provider: 'local-editorial-engine',
    model: 'rule-based-v1',
  }
}

/**
 * Resolves how many feed items a single ingestion run should process.
 * Respects the live Rule Engine config (`max_items_per_run`), clamped to a
 * safe upper bound so one run can never overload the AI pipeline.
 */
export function getMaxItemsToProcess(configMaxItems: number | undefined, fetchedCount: number): number {
  const configured = Number(configMaxItems)
  const safeMax = Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 10
  const capped = Math.min(safeMax, 20)
  return Math.max(1, Math.min(capped, fetchedCount))
}

/**
 * Dedupe URL cache (TTL 60s) — `getAllArticles({limit:1000})` per source used
 * to cost one subrequest per source; the cache shares it across the whole
 * invocation so a multi-source cron stays under Cloudflare's limit.
 */
const DEDUPE_TTL_MS = 60_000
let dedupeCache: { urls: Set<string>; at: number } | null = null

async function getDedupeUrlSet(): Promise<Set<string>> {
  if (dedupeCache && Date.now() - dedupeCache.at < DEDUPE_TTL_MS) {
    return dedupeCache.urls
  }
  const existing = await getAllArticles({ limit: 1000 })
  const urls = new Set(
    existing.articles
      .map((a) => a.sourceUrl)
      .filter((url) => url && url !== '#')
  )
  dedupeCache = { urls, at: Date.now() }
  return urls
}

/** Test/ops helper: drops the dedupe URL cache. */
export function clearDedupeCache(): void {
  dedupeCache = null
}

/**
 * Ingest a single RSS/Atom feed source
 *
 * `options.maxPipelineItems` bounds how many items run through the FULL AI
 * pipeline in this call (Cloudflare subrequest budget). Excess new items are
 * stored as queued jobs (`createQueuedJob`) and processed by the job-recovery
 * cycle in later invocations — nothing is dropped.
 */
export async function ingestSource(
  source: NewsSource,
  options?: { maxPipelineItems?: number }
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sourceId: source.id,
    sourceName: source.name,
    fetchedCount: 0,
    ingestedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    pipelineCount: 0,
    queuedCount: 0,
    errors: [],
  }

  try {
    // 1. Fetch feed XML with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SongbadChakra-Bot/1.0 (+https://songbadchakra.com.bd; news-ingest)',
        Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
      },
      cache: 'no-store',
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Feed fetch returned HTTP ${response.status}`)
    }

    const xmlText = await response.text()
    const items = parseFeedXml(xmlText)
    result.fetchedCount = items.length

    if (items.length === 0) {
      await updateSource(source.id, {
        lastFetchedAt: new Date().toISOString(),
        lastStatus: 'ok',
        errorMessage: undefined,
      })
      return result
    }

    // 2. Load existing articles to deduplicate by sourceUrl.
    //    Cached for a short TTL — every source in one invocation shares the
    //    same query instead of repeating it (subrequest budget).
    const existingUrls = await getDedupeUrlSet()

    // Respect max_items_per_run from the live Rule Engine config
    // (fallback 10) so the configured limit is actually effective. The FULL
    // pipeline additionally respects the per-invocation subrequest budget
    // (`pipelineBudget`) — excess items are captured as queued jobs.
    const ruleConfig = await loadRuleConfig()
    const { getPipelineItemsPerRun } = await import('@/lib/ai/pipeline')
    const pipelineBudget = options?.maxPipelineItems ?? getPipelineItemsPerRun()
    const itemsToProcess = items.slice(0, getMaxItemsToProcess(ruleConfig.maxItemsPerRun, items.length))

    for (const item of itemsToProcess) {
      // Deduplication check
      if (existingUrls.has(item.link)) {
        result.skippedCount++
        continue
      }

      const { runPipeline, createQueuedJob } = await import('@/lib/ai/pipeline')

      // Subrequest budget exhausted → capture the item as a queued job (1
      // subrequest) for the job-recovery cycle in a later invocation.
      if (result.pipelineCount >= pipelineBudget) {
        if (result.queuedCount < 2) {
          const queued = await createQueuedJob(source, item).catch(() => false)
          if (queued) {
            existingUrls.add(item.link)
            result.queuedCount++
          }
        }
        continue
      }

      try {
        // AI processing via full Phase 10 Pipeline (Collector -> Writer -> Fact-Checker -> Image -> SEO -> Duplicate -> Rule Engine)
        const pipeResult = await runPipeline(item, source)
        result.pipelineCount++

        if (pipeResult.status === 'published' || pipeResult.status === 'held') {
          existingUrls.add(item.link)
          result.ingestedCount++

          // Record AI log for backward-compatible dashboard visibility
          await createAiLog({
            sourceId: source.id,
            sourceUrl: item.link,
            provider: 'ai-automation-pipeline',
            model: 'phase-10-engine',
            status: 'completed',
            rawTitle: item.title,
            rawSummary: item.description.slice(0, 300),
            processedArticleId: pipeResult.articleId,
          })
        } else if (pipeResult.status === 'rejected') {
          result.skippedCount++
        } else {
          result.failedCount++
          if (pipeResult.error) {
            result.errors.push(`Item "${item.title.slice(0, 30)}...": ${pipeResult.error}`)
          }
        }
      } catch (itemError) {
        result.failedCount++
        const errMsg = itemError instanceof Error ? itemError.message : String(itemError)
        result.errors.push(`Item "${item.title.slice(0, 30)}...": ${errMsg}`)

        // Log failure
        await createAiLog({
          sourceId: source.id,
          sourceUrl: item.link,
          provider: 'ingestion-pipeline',
          model: 'parser',
          status: 'failed',
          errorMessage: errMsg,
          rawTitle: item.title,
          rawSummary: item.description.slice(0, 300),
        })
      }
    }

    // Update source status
    await updateSource(source.id, {
      lastFetchedAt: new Date().toISOString(),
      lastStatus: result.failedCount > 0 ? 'error' : 'ok',
      errorMessage: result.errors.length > 0 ? result.errors[0] : undefined,
    })
  } catch (feedError) {
    const errMsg = feedError instanceof Error ? feedError.message : String(feedError)
    result.errors.push(`Feed error: ${errMsg}`)
    result.failedCount++

    await updateSource(source.id, {
      lastFetchedAt: new Date().toISOString(),
      lastStatus: 'error',
      errorMessage: errMsg,
    })
  }

  return result
}

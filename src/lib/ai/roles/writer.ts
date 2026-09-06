/**
 * Writer Role — সংবাদ লেখক
 *
 * Converts validated CollectorResult into a complete Bengali news article.
 * Uses AI model (via model-router) to generate structured JSON output.
 * Falls back to deterministic rule-based writer if AI is unavailable or fails JSON validation.
 *
 * Security: Prompt is constructed server-side. Feed content is clearly
 * delimited and cannot inject system instructions.
 */

import type { CollectorResult, WriterResult } from '@/types/ai'
import { callWithFallback } from '@/lib/ai/model-router'
import { generateSlug } from '@/lib/rss-ingestion'
import { stripHtmlToText } from '@/lib/rss-ingestion'

const BENGALI_CATEGORIES: Record<string, string> = {
  bangladesh: 'বাংলাদেশ',
  international: 'আন্তর্জাতিক',
  politics: 'রাজনীতি',
  economy: 'অর্থনীতি',
  sports: 'খেলাধুলা',
  technology: 'প্রযুক্তি',
  entertainment: 'বিনোদন',
  education: 'শিক্ষা',
  health: 'স্বাস্থ্য',
  opinion: 'মতামত',
  crime: 'অপরাধ',
  environment: 'পরিবেশ',
}

interface WriterAiOutput {
  headline: string
  summary: string
  body: string
  seo_title: string
  meta_description: string
  slug: string
  category: string
  tags: string[]
}

function buildWriterPrompt(collected: CollectorResult): string {
  const sourceContent = collected.content
    ? stripHtmlToText(collected.content).slice(0, 2000)
    : (collected.description || '').slice(0, 1000)

  // IMPORTANT: Feed content is clearly delimited to prevent prompt injection
  return `আপনি সংবাদচক্র পোর্টালের একজন অভিজ্ঞ বাংলা সংবাদ সম্পাদক।

নিচের মূল তথ্য ব্যবহার করে একটি মৌলিক, নিরপেক্ষ ও পেশাদার বাংলা সংবাদ নিবন্ধ লিখুন।

নির্দেশনা:
- প্রাকৃতিক ও সাবলীল বাংলায় লিখুন
- মূল তথ্য অপরিবর্তিত রাখুন
- নিজে থেকে কোনো তথ্য যোগ করবেন না
- উৎস নিবন্ধটি হুবহু কপি করবেন না
- মনগড়া উদ্ধৃতি বা দাবি যোগ করবেন না
- উৎস সংস্থার নাম উল্লেখ করুন

আউটপুট শুধুমাত্র নিচের JSON ফরম্যাটে দিন (কোনো মার্কডাউন বা অতিরিক্ত টেক্সট ছাড়া):
{
  "headline": "সংক্ষিপ্ত ও আকর্ষণীয় বাংলা শিরোনাম (সর্বোচ্চ ১০ শব্দ)",
  "summary": "২-৩ বাক্যের মূল সারসংক্ষেপ",
  "body": "<p>প্যারাগ্রাফ ১</p><p>প্যারাগ্রাফ ২</p><p>প্যারাগ্রাফ ৩</p>",
  "seo_title": "SEO-বান্ধব শিরোনাম (৫০-৬০ অক্ষর)",
  "meta_description": "মেটা বিবরণ (১৫০-১৬০ অক্ষর)",
  "slug": "url-friendly-slug-in-bengali-or-english",
  "category": "${collected.categoryHint || 'bangladesh'}",
  "tags": ["ট্যাগ১", "ট্যাগ২", "ট্যাগ৩"]
}

--- মূল সংবাদ তথ্য শুরু ---
উৎস: ${collected.sourceName}
শিরোনাম: ${collected.title}
বিবরণ: ${collected.description}
বিস্তারিত: ${sourceContent}
--- মূল সংবাদ তথ্য শেষ ---`
}

function validateAndParseWriterOutput(text: string, collected: CollectorResult): WriterAiOutput | null {
  try {
    // Strip any markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<WriterAiOutput>

    if (
      typeof parsed.headline !== 'string' || !parsed.headline.trim() ||
      typeof parsed.summary !== 'string' || !parsed.summary.trim() ||
      typeof parsed.body !== 'string' || !parsed.body.trim()
    ) {
      return null
    }

    return {
      headline: parsed.headline.trim().slice(0, 500),
      summary: (parsed.summary || '').trim().slice(0, 1000),
      body: (parsed.body || '').trim(),
      seo_title: (parsed.seo_title || parsed.headline).trim().slice(0, 70),
      meta_description: (parsed.meta_description || parsed.summary).trim().slice(0, 165),
      slug: (parsed.slug || generateSlug(parsed.headline)).trim().slice(0, 80),
      category: (parsed.category || collected.categoryHint || 'bangladesh').trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 10)
        : [collected.sourceName],
    }
  } catch {
    return null
  }
}

function buildDeterministicFallback(collected: CollectorResult): WriterAiOutput {
  const slug = generateSlug(collected.title)
  const category = collected.categoryHint || 'bangladesh'
  const categoryLabel = BENGALI_CATEGORIES[category] || 'বাংলাদেশ'
  const rawText = collected.description || collected.title
  const summary = rawText.length > 200 ? rawText.slice(0, 197) + '...' : rawText
  const body = collected.content
    ? collected.content.split(/\n+/).filter(Boolean).map((p) =>
        p.trim().startsWith('<p>') ? p : `<p>${p}</p>`
      ).join('\n')
    : `<p>${rawText}</p>`

  return {
    headline: collected.title,
    summary,
    body: body || `<p>${rawText}</p>`,
    seo_title: collected.title.slice(0, 60),
    meta_description: summary.slice(0, 155),
    slug,
    category,
    tags: [categoryLabel, collected.sourceName],
  }
}

export async function runWriter(collected: CollectorResult): Promise<WriterResult> {
  const issues: string[] = []
  const startMs = Date.now()

  const systemMsg = {
    role: 'system' as const,
    content:
      'আপনি একজন পেশাদার বাংলা সংবাদ সম্পাদক। শুধুমাত্র বৈধ JSON ফরম্যাটে আউটপুট দিন।',
  }
  const userMsg = {
    role: 'user' as const,
    content: buildWriterPrompt(collected),
  }

  try {
    const { response, attempts } = await callWithFallback(
      'writer',
      [systemMsg, userMsg],
      { temperature: 0.2, maxTokens: 3000, responseFormat: 'json' }
    )

    const parsed = validateAndParseWriterOutput(response.text, collected)
    if (!parsed) {
      issues.push('AI returned invalid JSON. Using deterministic fallback.')
      const fallback = buildDeterministicFallback(collected)
      const wordCount = stripHtmlToText(fallback.body).split(/\s+/).length
      return {
        status: 'PASS',
        score: 60,
        headline: fallback.headline,
        summary: fallback.summary,
        body: fallback.body,
        seoTitle: fallback.seo_title,
        metaDescription: fallback.meta_description,
        slug: fallback.slug,
        category: fallback.category,
        tags: fallback.tags,
        categoryLabel: BENGALI_CATEGORIES[fallback.category] || 'বাংলাদেশ',
        readingTime: Math.max(1, Math.ceil(wordCount / 180)),
        issues,
        provider: response.provider,
        model: response.model,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        latencyMs: Date.now() - startMs,
      }
    }

    const wordCount = stripHtmlToText(parsed.body).split(/\s+/).length
    const failedAttempts = attempts.filter((a) => a.error)
    if (failedAttempts.length > 0) {
      issues.push(`Used fallback after ${failedAttempts.length} failed attempt(s).`)
    }

    return {
      status: 'PASS',
      score: 90,
      headline: parsed.headline,
      summary: parsed.summary,
      body: parsed.body,
      seoTitle: parsed.seo_title,
      metaDescription: parsed.meta_description,
      slug: parsed.slug,
      category: parsed.category,
      categoryLabel: BENGALI_CATEGORIES[parsed.category] || 'বাংলাদেশ',
      tags: parsed.tags,
      readingTime: Math.max(1, Math.ceil(wordCount / 180)),
      issues,
      provider: response.provider,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      latencyMs: Date.now() - startMs,
    }
  } catch (err) {
    // All AI providers failed — use deterministic fallback
    const errMsg = err instanceof Error ? err.message : String(err)
    issues.push(`AI unavailable: ${errMsg}. Using deterministic fallback.`)

    const fallback = buildDeterministicFallback(collected)
    const wordCount = stripHtmlToText(fallback.body).split(/\s+/).length

    return {
      status: 'PASS',
      score: 50,
      headline: fallback.headline,
      summary: fallback.summary,
      body: fallback.body,
      seoTitle: fallback.seo_title,
      metaDescription: fallback.meta_description,
      slug: fallback.slug,
      category: fallback.category,
      tags: fallback.tags,
      categoryLabel: BENGALI_CATEGORIES[fallback.category] || 'বাংলাদেশ',
      readingTime: Math.max(1, Math.ceil(wordCount / 180)),
      issues,
      latencyMs: Date.now() - startMs,
    }
  }
}

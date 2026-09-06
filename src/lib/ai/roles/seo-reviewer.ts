/**
 * SEO Reviewer Role — SEO বিশেষজ্ঞ
 *
 * Evaluates the written article's SEO quality.
 * Checks: headline, SEO title, meta description, slug, keyword density, readability.
 * SEO must NEVER modify factual meaning — only flag issues.
 */

import type { WriterResult, SeoReviewerResult } from '@/types/ai'
import { callWithFallback } from '@/lib/ai/model-router'
import { stripHtmlToText } from '@/lib/rss-ingestion'

interface SeoAiOutput {
  score: number
  decision: 'PASS' | 'FAIL'
  issues: string[]
  suggestions: string[]
}

function buildSeoPrompt(written: WriterResult): string {
  const bodyText = stripHtmlToText(written.body).slice(0, 2000)

  return `আপনি একজন বাংলা SEO বিশেষজ্ঞ। নিচের সংবাদের SEO মান মূল্যায়ন করুন।

মূল্যায়ন করুন:
- শিরোনামের মান ও দৈর্ঘ্য (আদর্শ: ৫০-৬০ অক্ষর)
- মেটা বিবরণ (আদর্শ: ১৫০-১৬০ অক্ষর)
- স্লাগ (URL-বান্ধব, অর্থবহ)
- মূল কীওয়ার্ডের উপস্থিতি
- কীওয়ার্ড স্টাফিং (অতিরিক্ত পুনরাবৃত্তি) আছে কিনা
- বাংলা পঠনযোগ্যতা
- শিরোনাম ও বিষয়বস্তুর সামঞ্জস্য

স্কোর গাইডলাইন:
- 90-100: চমৎকার SEO
- 80-89: ভালো (প্রকাশযোগ্য)
- 70-79: গ্রহণযোগ্য
- 60-69: উন্নতি প্রয়োজন
- <60: গুরুত্বপূর্ণ সমস্যা

আউটপুট শুধুমাত্র JSON:
{
  "score": 0-100,
  "decision": "PASS" বা "FAIL",
  "issues": ["সমস্যা ১"],
  "suggestions": ["পরামর্শ ১"]
}

--- সংবাদ তথ্য ---
শিরোনাম: ${written.headline}
SEO শিরোনাম: ${written.seoTitle}
মেটা বিবরণ: ${written.metaDescription}
স্লাগ: ${written.slug}
বিষয়শ্রেণি: ${written.categoryLabel}
ট্যাগ: ${(written.tags || []).join(', ')}
মূল বিষয়বস্তু (আংশিক): ${bodyText}
--- সংবাদ তথ্য শেষ ---`
}

function parseSeoOutput(text: string, minimumScore: number): SeoAiOutput | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<SeoAiOutput>

    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50
    const decision = score >= minimumScore ? 'PASS' : 'FAIL'

    return {
      score,
      decision,
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.filter((i): i is string => typeof i === 'string')
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((s): s is string => typeof s === 'string')
        : [],
    }
  } catch {
    return null
  }
}

/**
 * Deterministic SEO check (used as fallback when AI is unavailable).
 */
function deterministicSeoCheck(written: WriterResult, minimumScore: number): SeoAiOutput {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Title length check
  const titleLen = written.seoTitle?.length ?? 0
  if (titleLen < 20) { issues.push('SEO শিরোনাম খুব ছোট।'); score -= 20 }
  else if (titleLen > 70) { issues.push('SEO শিরোনাম খুব বড়।'); score -= 10 }

  // Meta description check
  const metaLen = written.metaDescription?.length ?? 0
  if (metaLen < 50) { issues.push('মেটা বিবরণ খুব ছোট।'); score -= 20 }
  else if (metaLen > 170) { issues.push('মেটা বিবরণ খুব বড়।'); score -= 5 }

  // Slug check
  if (!written.slug || written.slug.length < 3) { issues.push('স্লাগ অনুপস্থিত বা খুব ছোট।'); score -= 15 }

  // Tags check
  if (!written.tags || written.tags.length === 0) { suggestions.push('ট্যাগ যোগ করুন।'); score -= 5 }

  // Body content check
  const bodyText = stripHtmlToText(written.body)
  if (bodyText.length < 100) { issues.push('সংবাদের বিষয়বস্তু খুব ছোট।'); score -= 20 }

  score = Math.max(0, score)
  return {
    score,
    decision: score >= minimumScore ? 'PASS' : 'FAIL',
    issues,
    suggestions,
  }
}

export async function runSeoReviewer(
  written: WriterResult,
  minimumScore = 80
): Promise<SeoReviewerResult> {
  const startMs = Date.now()

  const systemMsg = {
    role: 'system' as const,
    content: 'আপনি একজন বাংলা SEO বিশেষজ্ঞ। শুধুমাত্র বৈধ JSON ফরম্যাটে আউটপুট দিন।',
  }
  const userMsg = {
    role: 'user' as const,
    content: buildSeoPrompt(written),
  }

  try {
    const { response } = await callWithFallback(
      'seo_reviewer',
      [systemMsg, userMsg],
      { temperature: 0.1, maxTokens: 1000, responseFormat: 'json' }
    )

    const result = parseSeoOutput(response.text, minimumScore)
    if (!result) {
      const fallback = deterministicSeoCheck(written, minimumScore)
      return {
        status: fallback.decision,
        ...fallback,
        issues: [...fallback.issues, 'AI returned invalid JSON. Used deterministic check.'],
        provider: response.provider,
        model: response.model,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        latencyMs: Date.now() - startMs,
      }
    }

    return {
      status: result.decision,
      score: result.score,
      decision: result.decision,
      issues: result.issues,
      suggestions: result.suggestions,
      provider: response.provider,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      latencyMs: Date.now() - startMs,
    }
  } catch {
    // AI unavailable — use deterministic fallback
    const fallback = deterministicSeoCheck(written, minimumScore)
    return {
      status: fallback.decision,
      score: fallback.score,
      decision: fallback.decision,
      issues: [...fallback.issues, 'SEO AI unavailable. Used deterministic check.'],
      suggestions: fallback.suggestions,
      latencyMs: Date.now() - startMs,
    }
  }
}

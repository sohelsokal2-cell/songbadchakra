/**
 * Fact Checker Role — তথ্য যাচাইকারী
 *
 * Verifies the Writer's article against the original source evidence.
 * Returns a structured score (0–100), decision (PASS/FAIL), and list of claims.
 * A critical error always causes FAIL regardless of score.
 */

import type {
  CollectorResult,
  WriterResult,
  FactCheckerResult,
  FactCheckerClaim,
} from '@/types/ai'
import { callWithFallback } from '@/lib/ai/model-router'
import { stripHtmlToText } from '@/lib/rss-ingestion'

interface FactCheckerAiOutput {
  score: number
  decision: 'PASS' | 'FAIL'
  critical_error: boolean
  claims: Array<{
    claim: string
    status: 'SUPPORTED' | 'UNSUPPORTED' | 'CONTRADICTED' | 'UNCERTAIN'
    evidence?: string
  }>
  issues: string[]
}

function buildFactCheckerPrompt(written: WriterResult, collected: CollectorResult): string {
  const articleText = stripHtmlToText(written.body).slice(0, 3000)
  const sourceText = (collected.content
    ? stripHtmlToText(collected.content)
    : (collected.description || '')
  ).slice(0, 2000)

  return `আপনি একজন সংবাদ তথ্য যাচাইকারী। নিচের প্রকাশিতব্য সংবাদটি মূল তথ্যের বিপরীতে যাচাই করুন।

যাচাই করুন:
- নাম, স্থান, তারিখ, সংখ্যা সঠিক আছে কিনা
- শিরোনামের সাথে মূল বিষয়বস্তু সামঞ্জস্যপূর্ণ কিনা
- কোনো উদ্ধৃতি সমর্থিত কিনা
- কোনো অসমর্থিত বা বিতর্কিত দাবি আছে কিনা

আউটপুট শুধুমাত্র নিচের JSON ফরম্যাটে দিন:
{
  "score": 0-100,
  "decision": "PASS" বা "FAIL",
  "critical_error": true বা false,
  "claims": [
    {"claim": "দাবি", "status": "SUPPORTED|UNSUPPORTED|CONTRADICTED|UNCERTAIN", "evidence": "প্রমাণ বা null"}
  ],
  "issues": ["সমস্যা ১", "সমস্যা ২"]
}

নিয়ম:
- score >= 90 এবং critical_error = false → decision = "PASS"
- critical_error = true → সর্বদা decision = "FAIL"
- CONTRADICTED বা UNSUPPORTED দাবি থাকলে score কমান

--- প্রকাশিতব্য সংবাদ ---
শিরোনাম: ${written.headline}
সারসংক্ষেপ: ${written.summary}
মূল বিষয়বস্তু: ${articleText}
--- প্রকাশিতব্য সংবাদ শেষ ---

--- মূল উৎস তথ্য ---
উৎস: ${collected.sourceName}
মূল শিরোনাম: ${collected.title}
মূল বিবরণ: ${collected.description}
মূল বিস্তারিত: ${sourceText}
--- মূল উৎস তথ্য শেষ ---`
}

function parseFactCheckerOutput(text: string, minimumScore: number): FactCheckerResult | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<FactCheckerAiOutput>

    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50
    const criticalError = Boolean(parsed.critical_error)
    const claims: FactCheckerClaim[] = (parsed.claims || []).map((c) => ({
      claim: String(c.claim || ''),
      status: (['SUPPORTED', 'UNSUPPORTED', 'CONTRADICTED', 'UNCERTAIN'].includes(c.status)
        ? c.status
        : 'UNCERTAIN') as FactCheckerClaim['status'],
      evidence: c.evidence ? String(c.evidence) : undefined,
    }))

    // Critical error always fails
    const decision = criticalError || score < minimumScore ? 'FAIL' : 'PASS'

    return {
      status: decision,
      score,
      decision,
      criticalError,
      claims,
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.filter((i): i is string => typeof i === 'string')
        : [],
    }
  } catch {
    return null
  }
}

export async function runFactChecker(
  written: WriterResult,
  collected: CollectorResult,
  minimumScore = 90
): Promise<FactCheckerResult> {
  const startMs = Date.now()
  const issues: string[] = []

  const systemMsg = {
    role: 'system' as const,
    content: 'আপনি একজন সংবাদ তথ্য যাচাইকারী। শুধুমাত্র বৈধ JSON ফরম্যাটে আউটপুট দিন।',
  }
  const userMsg = {
    role: 'user' as const,
    content: buildFactCheckerPrompt(written, collected),
  }

  try {
    const { response } = await callWithFallback(
      'fact_checker',
      [systemMsg, userMsg],
      { temperature: 0.1, maxTokens: 2000, responseFormat: 'json' }
    )

    const result = parseFactCheckerOutput(response.text, minimumScore)
    if (!result) {
      issues.push('Fact checker returned invalid JSON. Defaulting to cautious FAIL.')
      return {
        status: 'FAIL',
        score: 0,
        decision: 'FAIL',
        criticalError: false,
        claims: [],
        issues: ['JSON parse error in fact checker response.'],
        provider: response.provider,
        model: response.model,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        latencyMs: Date.now() - startMs,
      }
    }

    return {
      ...result,
      issues: [...result.issues, ...issues],
      provider: response.provider,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      latencyMs: Date.now() - startMs,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    // All providers failed: return FAIL with explanation
    return {
      status: 'FAIL',
      score: 0,
      decision: 'FAIL',
      criticalError: false,
      claims: [],
      issues: [`Fact checker unavailable: ${errMsg}`],
      latencyMs: Date.now() - startMs,
    }
  }
}

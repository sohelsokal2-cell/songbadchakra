/**
 * Rule Engine — Deterministic Publication Gate
 *
 * This is NOT an AI component. It is pure TypeScript application logic.
 * It evaluates all role results against configured thresholds and decides:
 *   PUBLISH — all checks pass
 *   HOLD    — recoverable issue (e.g., image missing but optional)
 *   REJECT  — critical failure (e.g., fact check critical error, duplicate)
 *
 * AI roles provide data. The Rule Engine makes the final decision.
 * Admins can override any Rule Engine decision via the admin panel.
 */

import type {
  CollectorResult,
  WriterResult,
  FactCheckerResult,
  ImageReviewerResult,
  SeoReviewerResult,
  DuplicateCheckerResult,
  RuleEngineResult,
  RuleEngineDecision,
  AiRuleConfig,
} from '@/types/ai'

export interface RuleEngineInput {
  collector: CollectorResult
  writer: WriterResult
  factChecker: FactCheckerResult
  imageReviewer: ImageReviewerResult
  seoReviewer: SeoReviewerResult
  duplicateChecker: DuplicateCheckerResult
  config: AiRuleConfig
}

/**
 * Load Rule Engine configuration from Supabase, or return defaults.
 * Cached for a short TTL — the config is read by the cron route, every
 * ingestSource() call and the recovery cycle; caching keeps a single
 * invocation well under Cloudflare's subrequest limit.
 */
const RULE_CONFIG_TTL_MS = 60_000
let ruleConfigCache: { config: AiRuleConfig; at: number } | null = null

export function clearRuleConfigCache(): void {
  ruleConfigCache = null
}

export async function loadRuleConfig(): Promise<AiRuleConfig> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    if (ruleConfigCache && Date.now() - ruleConfigCache.at < RULE_CONFIG_TTL_MS) {
      return ruleConfigCache.config
    }
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/ai_rule_config?id=eq.default&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store',
        }
      )
      if (res.ok) {
        const rows = await res.json() as Record<string, unknown>[]
        if (rows.length > 0) {
          const r = rows[0]
          const config: AiRuleConfig = {
            id: 'default',
            factCheckerMin: Number(r.fact_checker_min ?? 90),
            seoMin: Number(r.seo_min ?? 80),
            imageMin: Number(r.image_min ?? 85),
            imageOptional: Boolean(r.image_optional ?? true),
            requireImage: Boolean(r.require_image ?? false),
            autoPublish: Boolean(r.auto_publish ?? true),
            maxItemsPerRun: Number(r.max_items_per_run ?? 10),
            updatedAt: String(r.updated_at ?? ''),
          }
          ruleConfigCache = { config, at: Date.now() }
          return config
        }
      }
    } catch {
      // Fall through to defaults
    }
  }

  // Default configuration
  return {
    id: 'default',
    factCheckerMin: 90,
    seoMin: 80,
    imageMin: 85,
    imageOptional: true,
    requireImage: false,
    autoPublish: true,
    maxItemsPerRun: 10,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * The deterministic Rule Engine.
 * Evaluates all role results and returns a publication decision.
 */
export function evaluateRuleEngine(input: RuleEngineInput): RuleEngineResult {
  const { collector, writer, factChecker, imageReviewer, seoReviewer, duplicateChecker, config } = input
  const reasons: string[] = []

  // ── Check 1: Collector ───────────────────────────────────────────────────
  const collectorOk = collector.status === 'PASS'
  if (!collectorOk) {
    reasons.push(`Collector FAIL: ${collector.issues.join('; ')}`)
  }

  // ── Check 2: Writer ──────────────────────────────────────────────────────
  const writerOk = writer.status === 'PASS'
  if (!writerOk) {
    reasons.push(`Writer FAIL: ${writer.issues.join('; ')}`)
  }

  // ── Check 3: Required fields ─────────────────────────────────────────────
  const requiredFieldsOk =
    Boolean(writer.headline?.trim()) &&
    Boolean(writer.slug?.trim()) &&
    Boolean(writer.body?.trim()) &&
    Boolean(writer.category?.trim()) &&
    Boolean(writer.summary?.trim())

  if (!requiredFieldsOk) {
    reasons.push('Required article fields are missing (headline, slug, body, category, or summary).')
  }

  // ── Check 4: Source URL ───────────────────────────────────────────────────
  const sourceUrlOk =
    Boolean(collector.originalUrl) &&
    collector.originalUrl !== '#' &&
    collector.originalUrl.startsWith('http')

  if (!sourceUrlOk) {
    reasons.push(`Invalid source URL: "${collector.originalUrl}".`)
  }

  // ── Check 5: Content sanitized ────────────────────────────────────────────
  const dangerousPatterns = [/<script/i, /javascript:/i, /<iframe/i, /onerror=/i, /onload=/i]
  const contentSanitized = !dangerousPatterns.some(
    (p) => p.test(writer.body) || p.test(writer.headline)
  )
  if (!contentSanitized) {
    reasons.push('Unsanitized content detected in article body or headline.')
  }

  // ── Check 6: Fact Checker ────────────────────────────────────────────────
  const factCheckerScore = factChecker.score
  const factCheckerOk =
    !factChecker.criticalError &&
    factCheckerScore >= config.factCheckerMin

  if (factChecker.criticalError) {
    reasons.push(`Fact Checker: CRITICAL ERROR — ${factChecker.issues.join('; ')}`)
  } else if (factCheckerScore < config.factCheckerMin) {
    reasons.push(
      `Fact Checker score ${factCheckerScore} below minimum ${config.factCheckerMin}.`
    )
  }

  // ── Check 7: Image Reviewer ───────────────────────────────────────────────
  const imageScore = imageReviewer.score
  const hasApprovedImage = Boolean(imageReviewer.approvedImageUrl)
  let imageOk: boolean
  // Tracks whether the reviewed image may actually be attached to the article.
  // A candidate that exists but scores below threshold is NEVER used, even when
  // image_optional=true lets the article proceed without it.
  let imageApproved: boolean

  if (config.requireImage && !hasApprovedImage) {
    imageOk = false
    imageApproved = false
    reasons.push('Image is required by Rule Config but no valid image was found.')
  } else if (hasApprovedImage && imageScore < config.imageMin) {
    // Image candidate exists but FAILED review. image_optional=true only allows
    // the article to proceed WITHOUT the image — it does NOT allow publishing
    // the failed image itself.
    imageApproved = false
    imageOk = config.imageOptional
    if (!imageOk) {
      reasons.push(`Image score ${imageScore} below minimum ${config.imageMin}.`)
    } else {
      reasons.push(
        `Image score ${imageScore} below minimum ${config.imageMin} — failed image removed (image_optional=true, publishing without it).`
      )
    }
  } else if (hasApprovedImage) {
    imageOk = true
    imageApproved = true
  } else {
    // No image available from the source — proceed without one (image optional)
    imageOk = true
    imageApproved = false
  }

  // ── Check 8: SEO Reviewer ────────────────────────────────────────────────
  const seoScore = seoReviewer.score
  const seoOk = seoScore >= config.seoMin
  if (!seoOk) {
    reasons.push(`SEO score ${seoScore} below minimum ${config.seoMin}.`)
  }

  // ── Check 9: Duplicate Checker ────────────────────────────────────────────
  const duplicateOk = duplicateChecker.decision !== 'DUPLICATE'
  if (!duplicateOk) {
    reasons.push(`Duplicate detected: ${duplicateChecker.issues.join('; ')}`)
  }

  // ── Final Decision ────────────────────────────────────────────────────────
  const criticalFailures = [
    collectorOk,
    writerOk,
    requiredFieldsOk,
    sourceUrlOk,
    contentSanitized,
    !factChecker.criticalError,
    duplicateOk,
  ]
  const nonCriticalFailures = [
    factCheckerOk,
    imageOk,
    seoOk,
  ]

  const hasCriticalFailure = criticalFailures.some((ok) => !ok)
  const hasNonCriticalFailure = nonCriticalFailures.some((ok) => !ok)

  let decision: RuleEngineDecision
  if (hasCriticalFailure) {
    decision = 'REJECT'
  } else if (hasNonCriticalFailure) {
    decision = 'HOLD'
  } else {
    decision = config.autoPublish ? 'PUBLISH' : 'HOLD'
    if (!config.autoPublish) {
      reasons.push('Auto-publish is disabled in Rule Config. Article held for manual review.')
    }
  }

  return {
    decision,
    reasons,
    imageApproved,
    checks: {
      collector: collectorOk,
      writer: writerOk,
      factChecker: factCheckerOk,
      imageReviewer: imageOk,
      seoReviewer: seoOk,
      duplicateChecker: duplicateOk,
      requiredFields: requiredFieldsOk,
      sourceUrl: sourceUrlOk,
      contentSanitized,
    },
    scores: {
      factChecker: factCheckerScore,
      imageReviewer: imageScore,
      seoReviewer: seoScore,
      duplicateChecker: duplicateChecker.similarity,
    },
  }
}

/**
 * AI Automation Engine Type Definitions
 * Covers all new Phase 10 structures: roles, providers, keys, models,
 * rule engine config, jobs, pipeline logs, and per-role outputs.
 */

// ─── Role Definitions ────────────────────────────────────────────────────────

export type AiRoleName =
  | 'collector'
  | 'writer'
  | 'fact_checker'
  | 'image_reviewer'
  | 'seo_reviewer'
  | 'duplicate_checker'

export interface AiRole {
  id: string
  roleName: AiRoleName
  displayName: string
  description: string
  instructions: string
  minimumScore: number
  autoEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Provider Definitions ────────────────────────────────────────────────────

export type ApiStyle = 'openai' | 'gemini' | 'custom'

export interface AiProvider {
  id: string
  providerName: string
  displayName: string
  baseUrl: string
  apiStyle: ApiStyle
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── API Key Labels ──────────────────────────────────────────────────────────
// Actual secrets live in Cloudflare Secrets / env vars.
// This only stores the env var name (label) + metadata.

export interface AiApiKeyLabel {
  id: string
  providerId: string
  label: string        // e.g. "GROQ_API_KEY" (env var name)
  displayLabel: string // e.g. "Groq Key 1"
  isActive: boolean
  priority: number
  lastUsedAt?: string
  lastErrorAt?: string
  errorCount: number
  createdAt: string
  updatedAt: string
}

// ─── Model Definitions ───────────────────────────────────────────────────────

export interface AiModel {
  id: string
  providerId: string
  modelName: string    // exact API identifier
  displayName: string
  contextLength?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Role → Model Assignments ────────────────────────────────────────────────

export interface AiRoleModel {
  id: string
  roleId: string
  modelId: string
  apiKeyLabelId?: string
  priority: number
  isActive: boolean
  maxRetries: number
  timeoutMs: number
  createdAt: string
  updatedAt: string
  // Joined fields (for convenience)
  providerName?: string
  providerDisplayName?: string
  modelName?: string
  modelDisplayName?: string
  apiStyle?: ApiStyle
  baseUrl?: string
  keyLabel?: string
}

// ─── Rule Engine Configuration ───────────────────────────────────────────────

export interface AiRuleConfig {
  id: string
  factCheckerMin: number
  seoMin: number
  imageMin: number
  imageOptional: boolean
  requireImage: boolean
  autoPublish: boolean
  maxItemsPerRun: number
  updatedAt: string
}

// ─── Job State Machine ───────────────────────────────────────────────────────

export type AiJobStatus =
  | 'queued'
  | 'collecting'
  | 'collected'
  | 'writing'
  | 'written'
  | 'fact_checking'
  | 'fact_checked'
  | 'image_reviewing'
  | 'image_reviewed'
  | 'seo_reviewing'
  | 'seo_reviewed'
  | 'duplicate_checking'
  | 'duplicate_checked'
  | 'rule_checking'
  | 'published'
  | 'retrying'
  | 'held'
  | 'rejected'
  | 'failed'

export interface AiJob {
  id: string
  sourceId?: string
  sourceUrl: string
  rawTitle?: string
  rawDescription?: string
  status: AiJobStatus
  attempt: number
  articleId?: string
  collectorResult?: CollectorResult
  writerResult?: WriterResult
  factCheckerResult?: FactCheckerResult
  imageReviewerResult?: ImageReviewerResult
  seoReviewerResult?: SeoReviewerResult
  duplicateCheckerResult?: DuplicateCheckerResult
  ruleEngineResult?: RuleEngineResult
  holdReason?: string
  rejectReason?: string
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Per-Role Pipeline Logs ──────────────────────────────────────────────────

export type PipelineLogStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export interface AiPipelineLog {
  id: string
  jobId: string
  role: AiRoleName | string
  provider?: string
  model?: string
  apiKeyLabel?: string  // label only, NEVER the actual key value
  status: PipelineLogStatus
  score?: number
  decision?: string
  attempt: number
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
  error?: string
  createdAt: string
}

// ─── Role Output Schemas ─────────────────────────────────────────────────────

export type RoleDecision = 'PASS' | 'FAIL'
export type FactCheckStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'CONTRADICTED' | 'UNCERTAIN'
export type DuplicateDecision = 'DUPLICATE' | 'NEW_STORY' | 'UPDATE'
export type LicenseStatus = 'allowed' | 'unknown' | 'restricted' | 'not_available'

// Collector result
export interface CollectorResult {
  status: RoleDecision
  sourceId: string
  sourceName: string
  originalUrl: string
  normalizedUrl: string
  title: string
  description: string
  content?: string
  pubDate?: string
  imageUrl?: string
  author?: string
  categoryHint?: string
  issues: string[]
}

// Writer result
export interface WriterResult {
  status: RoleDecision
  score: number
  headline: string
  summary: string
  body: string         // HTML content
  seoTitle: string
  metaDescription: string
  slug: string
  category: string
  categoryLabel: string
  tags: string[]
  readingTime: number
  issues: string[]
  provider?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
}

// Fact Checker result
export interface FactCheckerClaim {
  claim: string
  status: FactCheckStatus
  evidence?: string
}

export interface FactCheckerResult {
  status: RoleDecision
  score: number
  decision: RoleDecision
  criticalError: boolean
  claims: FactCheckerClaim[]
  issues: string[]
  provider?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
}

// Image Reviewer result
export interface ImageReviewerResult {
  status: RoleDecision
  score: number
  decision: RoleDecision
  approvedImageUrl?: string
  imageRelevance: number       // 0–100
  imageQuality: number         // 0–100
  imageSource?: string
  licenseStatus: LicenseStatus
  licenseUrl?: string
  attributionRequired: boolean
  issues: string[]
  provider?: string
  model?: string
  latencyMs?: number
}

// SEO Reviewer result
export interface SeoReviewerResult {
  status: RoleDecision
  score: number
  decision: RoleDecision
  issues: string[]
  suggestions: string[]
  provider?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
}

// Duplicate Checker result
export interface DuplicateCheckerResult {
  status: RoleDecision
  decision: DuplicateDecision
  similarity: number           // 0–100
  matchedArticleId?: string
  matchedArticleSlug?: string
  issues: string[]
  latencyMs?: number
}

// Rule Engine result
export type RuleEngineDecision = 'PUBLISH' | 'HOLD' | 'REJECT'

export interface RuleEngineResult {
  decision: RuleEngineDecision
  reasons: string[]
  checks: {
    collector: boolean
    writer: boolean
    factChecker: boolean
    imageReviewer: boolean
    seoReviewer: boolean
    duplicateChecker: boolean
    requiredFields: boolean
    sourceUrl: boolean
    contentSanitized: boolean
  }
  scores: {
    factChecker?: number
    imageReviewer?: number
    seoReviewer?: number
    duplicateChecker?: number
  }
}

// ─── Provider Call Types ─────────────────────────────────────────────────────

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderCallOptions {
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  responseFormat?: 'json' | 'text'
}

export interface ProviderResponse {
  text: string
  promptTokens?: number
  completionTokens?: number
  latencyMs: number
  provider: string
  model: string
}

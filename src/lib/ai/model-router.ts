/**
 * Model Router
 *
 * Resolves the priority-ordered list of models for a given AI role,
 * then calls them in sequence with exponential backoff.
 * Falls back to the next model on timeout, rate-limit, or error.
 * If all models fail, throws a dead-letter error.
 *
 * Architecture:
 *   ROLE → DB config (ai_role_models) → Model 1 → Model 2 → Model 3 → fail
 */

import type {
  AiRoleName,
  AiRoleModel,
  ProviderMessage,
  ProviderCallOptions,
  ProviderResponse,
} from '@/types/ai'
import { resolveApiKey } from './key-manager'
import { callGemini } from './providers/gemini'
import { callGroq, callOpenRouter, callNvidia } from './providers/openai-compat'

/**
 * Shared model catalog cached for a short TTL.
 *
 * Each pipeline run resolves models for ~5 roles. Without caching that costs
 * 4 Supabase subrequests PER ROLE (20/run) — enough on its own to blow
 * Cloudflare Workers' 50-subrequest limit. The catalog caches the role-model
 * assignments, role IDs, models+providers and key labels once per TTL window
 * so all role lookups share the same 4 fetches.
 */
interface RouterCatalog {
  roleModels: Record<string, unknown>[]
  roleIdByName: Record<string, string>
  models: Awaited<ReturnType<typeof fetchModelData>>
  keys: Awaited<ReturnType<typeof fetchKeyData>>
}

const CATALOG_TTL_MS = 60_000
let catalogCache: { catalog: RouterCatalog; at: number } | null = null

async function loadCatalog(
  supabaseUrl: string,
  supabaseKey: string
): Promise<RouterCatalog> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.catalog
  }

  const [rmRes, rolesRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/ai_role_models?select=*&is_active=eq.true&order=priority.asc`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/ai_roles?select=id,role_name`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' }
    ),
  ])
  if (!rmRes.ok) throw new Error(`ai_role_models fetch failed: ${rmRes.status}`)
  const allRoleModels = await rmRes.json() as Record<string, unknown>[]
  const roleRows = rolesRes.ok ? (await rolesRes.json() as Record<string, unknown>[]) : []
  const roleIdByName: Record<string, string> = {}
  for (const r of roleRows) roleIdByName[String(r.role_name)] = String(r.id)

  // Fetch the full (small) model & key catalogs once, shared by all roles.
  const [models, keys] = await Promise.all([
    fetchModelData(supabaseUrl, supabaseKey, null),
    fetchKeyData(supabaseUrl, supabaseKey, null),
  ])

  const catalog: RouterCatalog = { roleModels: allRoleModels, roleIdByName, models, keys }
  catalogCache = { catalog, at: Date.now() }
  return catalog
}

/** Test/ops helper: drops the cached model catalog. */
export function clearModelCatalogCache(): void {
  catalogCache = null
}

/**
 * Load ordered role-model assignments from Supabase (or env fallback).
 * Returns them sorted by priority ascending (1 = primary).
 */
export async function loadRoleModels(roleName: AiRoleName): Promise<AiRoleModel[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const catalog = await loadCatalog(supabaseUrl, supabaseKey)

      const roleId = catalog.roleIdByName[roleName]
      if (!roleId) return buildFallbackModels(roleName)

      const filtered = catalog.roleModels.filter((rm) => rm.role_id === roleId)
      if (filtered.length === 0) return buildFallbackModels(roleName)

      return filtered.map((rm) => {
        const m = catalog.models.find((x) => x.id === rm.model_id)
        const k = catalog.keys.find((x) => x.id === rm.api_key_label_id)
        return {
          id: String(rm.id),
          roleId: String(rm.role_id),
          modelId: String(rm.model_id),
          apiKeyLabelId: rm.api_key_label_id ? String(rm.api_key_label_id) : undefined,
          priority: Number(rm.priority),
          isActive: Boolean(rm.is_active),
          maxRetries: Number(rm.max_retries ?? 2),
          timeoutMs: Number(rm.timeout_ms ?? 30000),
          createdAt: String(rm.created_at ?? ''),
          updatedAt: String(rm.updated_at ?? ''),
          providerName: m?.providerName,
          providerDisplayName: m?.providerDisplayName,
          modelName: m?.modelName,
          modelDisplayName: m?.displayName,
          apiStyle: m?.apiStyle as AiRoleModel['apiStyle'],
          baseUrl: m?.baseUrl,
          keyLabel: k?.label,
        } satisfies AiRoleModel
      })
    } catch {
      // Fall through to env-based fallback
    }
  }

  return buildFallbackModels(roleName)
}

async function fetchModelData(
  supabaseUrl: string,
  supabaseKey: string,
  modelIds: string[] | null
): Promise<{
  id: string
  modelName: string
  displayName: string
  apiStyle: string
  baseUrl: string
  providerName: string
  providerDisplayName: string
}[]> {
  const idsParam = modelIds && modelIds.length > 0
    ? `&id=in.(${modelIds.map((id) => encodeURIComponent(id)).join(',')})`
    : ''
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_models?select=*,ai_providers(*)${idsParam}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: 'no-store',
    }
  )
  if (!res.ok) return []
  const rows = await res.json() as Record<string, unknown>[]
  return rows.map((r) => {
    const prov = r.ai_providers as Record<string, unknown> | undefined
    return {
      id: String(r.id),
      modelName: String(r.model_name),
      displayName: String(r.display_name),
      apiStyle: String(prov?.api_style ?? 'openai'),
      baseUrl: String(prov?.base_url ?? ''),
      providerName: String(prov?.provider_name ?? ''),
      providerDisplayName: String(prov?.display_name ?? ''),
    }
  })
}

async function fetchKeyData(
  supabaseUrl: string,
  supabaseKey: string,
  keyIds: string[] | null
): Promise<{ id: string; label: string }[]> {
  const idsParam = keyIds && keyIds.length > 0
    ? `&id=in.(${keyIds.map((id) => encodeURIComponent(id)).join(',')})`
    : ''
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_api_key_labels?select=id,label${idsParam}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: 'no-store',
    }
  )
  if (!res.ok) return []
  return (await res.json() as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    label: String(r.label),
  }))
}

/**
 * Env-variable-based fallback when DB is not available.
 * Uses only models verified to be currently available (2026-09).
 * Priority: Gemini 3.6 Flash → OpenRouter Llama 3.3 70B → Groq qwen3.6-27b
 */
function buildFallbackModels(roleName: AiRoleName): AiRoleModel[] {
  const models: AiRoleModel[] = []
  const base = {
    roleId: roleName,
    isActive: true,
    maxRetries: 2,
    createdAt: '',
    updatedAt: '',
  }

  if (process.env.GEMINI_API_KEY) {
    models.push({
      ...base,
      id: `fallback-gemini-${roleName}`,
      modelId: 'gemini-3.6-flash',
      priority: 1,
      timeoutMs: 45000,
      providerName: 'gemini',
      modelName: 'gemini-3.6-flash',
      apiStyle: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      keyLabel: 'GEMINI_API_KEY',
    })
  }

  if (process.env.OPENROUTER_API_KEY) {
    models.push({
      ...base,
      id: `fallback-openrouter-${roleName}`,
      modelId: 'meta-llama/llama-3.3-70b-instruct',
      priority: 2,
      timeoutMs: 45000,
      providerName: 'openrouter',
      modelName: 'meta-llama/llama-3.3-70b-instruct',
      apiStyle: 'openai',
      baseUrl: 'https://openrouter.ai/api',
      keyLabel: 'OPENROUTER_API_KEY',
    })
  }

  if (process.env.GROQ_API_KEY) {
    models.push({
      ...base,
      id: `fallback-groq-${roleName}`,
      modelId: 'qwen/qwen3.6-27b',
      priority: 3,
      timeoutMs: 30000,
      providerName: 'groq',
      modelName: 'qwen/qwen3.6-27b',
      apiStyle: 'openai',
      baseUrl: 'https://api.groq.com/openai',
      keyLabel: 'GROQ_API_KEY',
    })
  }

  return models
}

/**
 * Call an AI provider/model by name.
 */
async function callModel(
  providerName: string,
  modelName: string,
  apiKey: string,
  messages: ProviderMessage[],
  options: ProviderCallOptions,
  baseUrl?: string
): Promise<ProviderResponse> {
  switch (providerName) {
    case 'gemini':
      return callGemini(modelName, apiKey, messages, options)
    case 'groq':
      return callGroq(modelName, apiKey, messages, options)
    case 'openrouter':
      return callOpenRouter(modelName, apiKey, messages, options)
    case 'nvidia':
      return callNvidia(modelName, apiKey, messages, options)
    default:
      // Generic OpenAI-compat for unknown providers
      if (!baseUrl) throw new Error(`Unknown provider: ${providerName}`)
      const { callOpenAiCompat } = await import('./providers/openai-compat')
      return callOpenAiCompat({ baseUrl, apiKey, modelName, messages, options, providerName })
  }
}

export interface ModelRouterAttempt {
  modelId: string
  modelName: string
  providerName: string
  keyLabel: string
  attempt: number
  error?: string
  latencyMs?: number
}

export interface ModelRouterResult {
  response: ProviderResponse
  attempts: ModelRouterAttempt[]
}

/**
 * Main entry point: call the best available model for a role,
 * with automatic fallback and exponential backoff.
 */
export async function callWithFallback(
  roleName: AiRoleName,
  messages: ProviderMessage[],
  options: ProviderCallOptions = {}
): Promise<ModelRouterResult> {
  const roleModels = await loadRoleModels(roleName)

  if (roleModels.length === 0) {
    throw new Error(
      `No active models configured for role "${roleName}". ` +
        'Please configure at least one model in Admin → AI Automation → Models.'
    )
  }

  const attempts: ModelRouterAttempt[] = []

  for (const rm of roleModels) {
    const keyLabel = rm.keyLabel
    if (!keyLabel) continue

    const apiKey = resolveApiKey(keyLabel)
    if (!apiKey) {
      attempts.push({
        modelId: rm.modelId,
        modelName: rm.modelName ?? rm.modelId,
        providerName: rm.providerName ?? '',
        keyLabel,
        attempt: attempts.length + 1,
        error: `API key not set: ${keyLabel}`,
      })
      continue
    }

    const modelOptions: ProviderCallOptions = {
      ...options,
      timeoutMs: rm.timeoutMs,
    }

    let lastError: Error | null = null
    const maxRetries = Math.max(1, rm.maxRetries)

    for (let retry = 1; retry <= maxRetries; retry++) {
      const startMs = Date.now()
      try {
        const response = await callModel(
          rm.providerName ?? '',
          rm.modelName ?? rm.modelId,
          apiKey,
          messages,
          modelOptions,
          rm.baseUrl
        )
        attempts.push({
          modelId: rm.modelId,
          modelName: rm.modelName ?? rm.modelId,
          providerName: rm.providerName ?? '',
          keyLabel,
          attempt: attempts.length + 1,
          latencyMs: Date.now() - startMs,
        })
        return { response, attempts }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const latency = Date.now() - startMs

        if (retry < maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms...
          const backoffMs = Math.min(500 * Math.pow(2, retry - 1), 5000)
          await delay(backoffMs)
        } else {
          attempts.push({
            modelId: rm.modelId,
            modelName: rm.modelName ?? rm.modelId,
            providerName: rm.providerName ?? '',
            keyLabel,
            attempt: attempts.length + 1,
            error: lastError.message,
            latencyMs: latency,
          })
        }
      }
    }
  }

  throw new Error(
    `All models failed for role "${roleName}". ` +
      `Attempted ${attempts.length} model(s): ${attempts.map((a) => `${a.providerName}/${a.modelName}`).join(', ')}`
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

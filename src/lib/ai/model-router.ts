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
 * Load ordered role-model assignments from Supabase (or env fallback).
 * Returns them sorted by priority ascending (1 = primary).
 */
export async function loadRoleModels(roleName: AiRoleName): Promise<AiRoleModel[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      // Fetch active role model assignments sorted by priority
      const rmRes = await fetch(
        `${supabaseUrl}/rest/v1/ai_role_models?select=*&is_active=eq.true&order=priority.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store',
        }
      )
      if (!rmRes.ok) throw new Error(`ai_role_models fetch failed: ${rmRes.status}`)
      const allRoleModels = await rmRes.json() as Record<string, unknown>[]

      // Get role ID for this role name
      const rolesRes = await fetch(
        `${supabaseUrl}/rest/v1/ai_roles?select=id,role_name&role_name=eq.${encodeURIComponent(roleName)}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store',
        }
      )
      const roles = rolesRes.ok ? (await rolesRes.json() as Record<string, unknown>[]) : []
      const roleId = roles[0]?.id as string | undefined
      if (!roleId) return buildFallbackModels(roleName)

      const filtered = allRoleModels.filter((rm) => rm.role_id === roleId)
      if (filtered.length === 0) return buildFallbackModels(roleName)

      // Enrich with model/provider/key info
      const modelIds = [...new Set(filtered.map((rm) => rm.model_id as string))]
      const keyIds = [...new Set(filtered.map((rm) => rm.api_key_label_id as string).filter(Boolean))]

      const [modelsData, keysData] = await Promise.all([
        fetchModelData(supabaseUrl, supabaseKey, modelIds),
        fetchKeyData(supabaseUrl, supabaseKey, keyIds),
      ])

      return filtered.map((rm) => {
        const m = modelsData.find((x) => x.id === rm.model_id)
        const k = keysData.find((x) => x.id === rm.api_key_label_id)
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
  modelIds: string[]
): Promise<{
  id: string
  modelName: string
  displayName: string
  apiStyle: string
  baseUrl: string
  providerName: string
  providerDisplayName: string
}[]> {
  if (modelIds.length === 0) return []
  const ids = modelIds.map((id) => encodeURIComponent(id)).join(',')
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_models?select=*,ai_providers(*)&id=in.(${ids})`,
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
  keyIds: string[]
): Promise<{ id: string; label: string }[]> {
  if (keyIds.length === 0) return []
  const ids = keyIds.map((id) => encodeURIComponent(id)).join(',')
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ai_api_key_labels?select=id,label&id=in.(${ids})`,
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
 * Prioritizes Gemini, then Groq.
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
      modelId: 'gemini-1.5-flash',
      priority: 1,
      timeoutMs: 30000,
      providerName: 'gemini',
      modelName: 'gemini-1.5-flash',
      apiStyle: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      keyLabel: 'GEMINI_API_KEY',
    })
  }

  if (process.env.GROQ_API_KEY) {
    models.push({
      ...base,
      id: `fallback-groq-${roleName}`,
      modelId: 'llama-3.3-70b-versatile',
      priority: 2,
      timeoutMs: 30000,
      providerName: 'groq',
      modelName: 'llama-3.3-70b-versatile',
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

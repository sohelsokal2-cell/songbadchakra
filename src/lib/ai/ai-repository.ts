/**
 * AI Automation Repository
 *
 * Full data access layer for Phase 10 AI Automation Engine:
 * - Providers, API Key Labels, Models
 * - Roles & Role-Model priority assignments
 * - Rule Engine configuration
 * - Jobs state machine & execution history
 * - Role-level pipeline logs
 *
 * Uses Supabase REST API via fetch (works in Cloudflare Workers / edge / Node.js).
 * Falls back safely to defaults / in-memory store when Supabase is not connected.
 */

import type {
  AiProvider,
  AiApiKeyLabel,
  AiModel,
  AiRole,
  AiRoleModel,
  AiRuleConfig,
  AiJob,
  AiJobStatus,
  AiPipelineLog,
} from '@/types/ai'
import { getMaskedEnvVarStatus } from './key-manager'

// ─── Supabase Client Helpers ──────────────────────────────────────────────────

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}

async function querySupabase<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        ...cfg.headers,
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn(`Supabase REST ${options?.method || 'GET'} ${endpoint} failed (${res.status}): ${errText}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn(`Supabase query exception for ${endpoint}:`, err)
    return null
  }
}

// ─── Default In-Memory Fallbacks ──────────────────────────────────────────────

const DEFAULT_PROVIDERS: AiProvider[] = [
  { id: 'prov-gemini', providerName: 'gemini', displayName: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com', apiStyle: 'gemini', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prov-groq', providerName: 'groq', displayName: 'Groq', baseUrl: 'https://api.groq.com/openai', apiStyle: 'openai', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prov-openrouter', providerName: 'openrouter', displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api', apiStyle: 'openai', isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prov-nvidia', providerName: 'nvidia', displayName: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com', apiStyle: 'openai', isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEFAULT_KEY_LABELS: AiApiKeyLabel[] = [
  { id: 'key-gemini-1', providerId: 'prov-gemini', label: 'GEMINI_API_KEY', displayLabel: 'Gemini Key 1', isActive: true, priority: 1, errorCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'key-groq-1', providerId: 'prov-groq', label: 'GROQ_API_KEY', displayLabel: 'Groq Key 1', isActive: true, priority: 1, errorCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEFAULT_MODELS: AiModel[] = [
  { id: 'model-gemini-flash', providerId: 'prov-gemini', modelName: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', contextLength: 1000000, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'model-gemini-flash-8b', providerId: 'prov-gemini', modelName: 'gemini-1.5-flash-8b', displayName: 'Gemini 1.5 Flash 8B', contextLength: 1000000, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'model-groq-llama', providerId: 'prov-groq', modelName: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Groq)', contextLength: 128000, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'model-groq-llama-scout', providerId: 'prov-groq', modelName: 'meta-llama/llama-4-scout-17b-16e-instruct', displayName: 'Llama 4 Scout (Groq)', contextLength: 131072, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEFAULT_ROLES: AiRole[] = [
  { id: 'role-collector', roleName: 'collector', displayName: 'তথ্য সংগ্রাহক', description: 'RSS ও নিউজ ফিড থেকে সংবাদ সংগ্রহ ও স্যানিটাইজ করে।', instructions: '', minimumScore: 0, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role-writer', roleName: 'writer', displayName: 'সংবাদ লেখক', description: 'সংগৃহীত তথ্য থেকে মৌলিক ও নিরপেক্ষ বাংলা সংবাদ রচনা করে।', instructions: '', minimumScore: 0, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role-fact-checker', roleName: 'fact_checker', displayName: 'তথ্য যাচাইকারী', description: 'সংবাদের প্রতিটি দাবি, তথ্য ও উদ্ধৃতি যাচাই করে নির্ভরযোগ্যতা স্কোর দেয়।', instructions: '', minimumScore: 90, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role-image-reviewer', roleName: 'image_reviewer', displayName: 'ছবি যাচাইকারী', description: 'সংবাদ-সংশ্লিষ্ট ছবির লাইসেন্স, গুণগত মান ও প্রাসঙ্গিকতা যাচাই করে।', instructions: '', minimumScore: 85, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role-seo-reviewer', roleName: 'seo_reviewer', displayName: 'SEO বিশেষজ্ঞ', description: 'শিরোনাম, মেটা ডেসক্রিপশন, কি-ওয়ার্ড ও সার্চ অপ্টিমাইজেশন নিশ্চিত করে।', instructions: '', minimumScore: 80, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'role-duplicate-checker', roleName: 'duplicate_checker', displayName: 'ডুপ্লিকেট শনাক্তকারী', description: 'পূর্বে প্রকাশিত সংবাদের সাথে মিল শনাক্ত করে পুনরাবৃত্তি রোধ করে।', instructions: '', minimumScore: 0, autoEnabled: true, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEFAULT_ROLE_MODELS: AiRoleModel[] = [
  { id: 'rm-writer-1', roleId: 'role-writer', modelId: 'model-gemini-flash', apiKeyLabelId: 'key-gemini-1', priority: 1, isActive: true, maxRetries: 2, timeoutMs: 30000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-writer-2', roleId: 'role-writer', modelId: 'model-groq-llama', apiKeyLabelId: 'key-groq-1', priority: 2, isActive: true, maxRetries: 2, timeoutMs: 30000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-fc-1', roleId: 'role-fact-checker', modelId: 'model-gemini-flash', apiKeyLabelId: 'key-gemini-1', priority: 1, isActive: true, maxRetries: 2, timeoutMs: 30000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-fc-2', roleId: 'role-fact-checker', modelId: 'model-groq-llama', apiKeyLabelId: 'key-groq-1', priority: 2, isActive: true, maxRetries: 2, timeoutMs: 30000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-seo-1', roleId: 'role-seo-reviewer', modelId: 'model-gemini-flash-8b', apiKeyLabelId: 'key-gemini-1', priority: 1, isActive: true, maxRetries: 2, timeoutMs: 20000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-seo-2', roleId: 'role-seo-reviewer', modelId: 'model-groq-llama', apiKeyLabelId: 'key-groq-1', priority: 2, isActive: true, maxRetries: 2, timeoutMs: 20000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-img-1', roleId: 'role-image-reviewer', modelId: 'model-gemini-flash-8b', apiKeyLabelId: 'key-gemini-1', priority: 1, isActive: true, maxRetries: 2, timeoutMs: 15000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-img-2', roleId: 'role-image-reviewer', modelId: 'model-groq-llama-scout', apiKeyLabelId: 'key-groq-1', priority: 2, isActive: true, maxRetries: 2, timeoutMs: 15000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-dup-1', roleId: 'role-duplicate-checker', modelId: 'model-gemini-flash-8b', apiKeyLabelId: 'key-gemini-1', priority: 1, isActive: true, maxRetries: 1, timeoutMs: 15000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// In-memory fallbacks for non-DB runtime
let inMemoryRuleConfig: AiRuleConfig = {
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

// ─── 1. Providers ─────────────────────────────────────────────────────────────

export async function getAiProviders(): Promise<AiProvider[]> {
  const rows = await querySupabase<Record<string, unknown>[]>('ai_providers?order=created_at.asc')
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      id: String(r.id),
      providerName: String(r.provider_name),
      displayName: String(r.display_name),
      baseUrl: String(r.base_url),
      apiStyle: r.api_style as AiProvider['apiStyle'],
      isActive: Boolean(r.is_active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }))
  }
  return DEFAULT_PROVIDERS
}

export async function updateAiProvider(id: string, updates: Partial<AiProvider>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.displayName !== undefined) payload.display_name = updates.displayName
  if (updates.baseUrl !== undefined) payload.base_url = updates.baseUrl
  if (updates.apiStyle !== undefined) payload.api_style = updates.apiStyle
  if (updates.isActive !== undefined) payload.is_active = updates.isActive

  const res = await querySupabase(`ai_providers?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

export async function createAiProvider(provider: Omit<AiProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<AiProvider | null> {
  const id = `prov-${provider.providerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  const now = new Date().toISOString()
  const payload = {
    id,
    provider_name: provider.providerName,
    display_name: provider.displayName,
    base_url: provider.baseUrl,
    api_style: provider.apiStyle,
    is_active: provider.isActive,
    created_at: now,
    updated_at: now,
  }
  const rows = await querySupabase<Record<string, unknown>[]>('ai_providers', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=representation' },
  })
  if (rows && rows[0]) {
    return {
      id: String(rows[0].id),
      providerName: String(rows[0].provider_name),
      displayName: String(rows[0].display_name),
      baseUrl: String(rows[0].base_url),
      apiStyle: rows[0].api_style as AiProvider['apiStyle'],
      isActive: Boolean(rows[0].is_active),
      createdAt: String(rows[0].created_at),
      updatedAt: String(rows[0].updated_at),
    }
  }
  return null
}

export async function deleteAiProvider(id: string): Promise<boolean> {
  const res = await querySupabase(`ai_providers?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 2. API Key Labels ────────────────────────────────────────────────────────

export async function getApiKeyLabels(providerId?: string): Promise<Array<AiApiKeyLabel & { isSetInEnv: boolean }>> {
  let endpoint = 'ai_api_key_labels?order=priority.asc,created_at.asc'
  if (providerId) {
    endpoint += `&provider_id=eq.${encodeURIComponent(providerId)}`
  }
  const rows = await querySupabase<Record<string, unknown>[]>(endpoint)
  const list = rows && rows.length > 0 ? rows.map((r) => ({
    id: String(r.id),
    providerId: String(r.provider_id),
    label: String(r.label),
    displayLabel: String(r.display_label),
    isActive: Boolean(r.is_active),
    priority: Number(r.priority || 1),
    lastUsedAt: r.last_used_at ? String(r.last_used_at) : undefined,
    lastErrorAt: r.last_error_at ? String(r.last_error_at) : undefined,
    errorCount: Number(r.error_count || 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  })) : DEFAULT_KEY_LABELS.filter((k) => !providerId || k.providerId === providerId)

  return list.map((k) => {
    const status = getMaskedEnvVarStatus(k.label)
    return {
      ...k,
      isSetInEnv: status.isSet,
    }
  })
}

export async function createApiKeyLabel(data: {
  providerId: string
  label: string
  displayLabel: string
  priority?: number
}): Promise<AiApiKeyLabel | null> {
  const id = `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const now = new Date().toISOString()
  const payload = {
    id,
    provider_id: data.providerId,
    label: data.label.trim().toUpperCase(),
    display_label: data.displayLabel.trim(),
    priority: data.priority ?? 1,
    is_active: true,
    created_at: now,
    updated_at: now,
  }
  const rows = await querySupabase<Record<string, unknown>[]>('ai_api_key_labels', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=representation' },
  })
  if (rows && rows[0]) {
    return {
      id: String(rows[0].id),
      providerId: String(rows[0].provider_id),
      label: String(rows[0].label),
      displayLabel: String(rows[0].display_label),
      isActive: Boolean(rows[0].is_active),
      priority: Number(rows[0].priority),
      errorCount: 0,
      createdAt: String(rows[0].created_at),
      updatedAt: String(rows[0].updated_at),
    }
  }
  return null
}

export async function updateApiKeyLabel(id: string, updates: Partial<AiApiKeyLabel>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.displayLabel !== undefined) payload.display_label = updates.displayLabel
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  if (updates.priority !== undefined) payload.priority = updates.priority

  const res = await querySupabase(`ai_api_key_labels?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

export async function deleteApiKeyLabel(id: string): Promise<boolean> {
  const res = await querySupabase(`ai_api_key_labels?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 3. Models ────────────────────────────────────────────────────────────────

export async function getAiModels(providerId?: string): Promise<AiModel[]> {
  let endpoint = 'ai_models?order=created_at.asc'
  if (providerId) {
    endpoint += `&provider_id=eq.${encodeURIComponent(providerId)}`
  }
  const rows = await querySupabase<Record<string, unknown>[]>(endpoint)
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      id: String(r.id),
      providerId: String(r.provider_id),
      modelName: String(r.model_name),
      displayName: String(r.display_name),
      contextLength: r.context_length ? Number(r.context_length) : undefined,
      isActive: Boolean(r.is_active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }))
  }
  return DEFAULT_MODELS.filter((m) => !providerId || m.providerId === providerId)
}

export async function createAiModel(data: {
  providerId: string
  modelName: string
  displayName: string
  contextLength?: number
}): Promise<AiModel | null> {
  const id = `model-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const now = new Date().toISOString()
  const payload = {
    id,
    provider_id: data.providerId,
    model_name: data.modelName.trim(),
    display_name: data.displayName.trim(),
    context_length: data.contextLength ?? null,
    is_active: true,
    created_at: now,
    updated_at: now,
  }
  const rows = await querySupabase<Record<string, unknown>[]>('ai_models', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=representation' },
  })
  if (rows && rows[0]) {
    return {
      id: String(rows[0].id),
      providerId: String(rows[0].provider_id),
      modelName: String(rows[0].model_name),
      displayName: String(rows[0].display_name),
      contextLength: rows[0].context_length ? Number(rows[0].context_length) : undefined,
      isActive: Boolean(rows[0].is_active),
      createdAt: String(rows[0].created_at),
      updatedAt: String(rows[0].updated_at),
    }
  }
  return null
}

export async function updateAiModel(id: string, updates: Partial<AiModel>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.displayName !== undefined) payload.display_name = updates.displayName
  if (updates.modelName !== undefined) payload.model_name = updates.modelName
  if (updates.contextLength !== undefined) payload.context_length = updates.contextLength
  if (updates.isActive !== undefined) payload.is_active = updates.isActive

  const res = await querySupabase(`ai_models?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

export async function deleteAiModel(id: string): Promise<boolean> {
  const res = await querySupabase(`ai_models?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 4. Roles ─────────────────────────────────────────────────────────────────

export async function getAiRoles(): Promise<AiRole[]> {
  const rows = await querySupabase<Record<string, unknown>[]>('ai_roles?order=created_at.asc')
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      id: String(r.id),
      roleName: r.role_name as AiRole['roleName'],
      displayName: String(r.display_name),
      description: String(r.description || ''),
      instructions: String(r.instructions || ''),
      minimumScore: Number(r.minimum_score ?? 80),
      autoEnabled: Boolean(r.auto_enabled),
      isActive: Boolean(r.is_active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }))
  }
  return DEFAULT_ROLES
}

export async function updateAiRole(id: string, updates: Partial<AiRole>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.displayName !== undefined) payload.display_name = updates.displayName
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.instructions !== undefined) payload.instructions = updates.instructions
  if (updates.minimumScore !== undefined) payload.minimum_score = updates.minimumScore
  if (updates.autoEnabled !== undefined) payload.auto_enabled = updates.autoEnabled
  if (updates.isActive !== undefined) payload.is_active = updates.isActive

  const res = await querySupabase(`ai_roles?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 5. Role-Model Assignments ────────────────────────────────────────────────

export async function getAiRoleModels(roleId?: string): Promise<AiRoleModel[]> {
  let endpoint = 'ai_role_models?select=*,model:ai_models(*,provider:ai_providers(*)),key:ai_api_key_labels(*)&order=priority.asc'
  if (roleId) {
    endpoint += `&role_id=eq.${encodeURIComponent(roleId)}`
  }
  const rows = await querySupabase<Record<string, unknown>[]>(endpoint)
  if (rows && rows.length > 0) {
    return rows.map((r) => {
      const model = r.model as Record<string, unknown> | undefined
      const provider = model?.provider as Record<string, unknown> | undefined
      const key = r.key as Record<string, unknown> | undefined

      return {
        id: String(r.id),
        roleId: String(r.role_id),
        modelId: String(r.model_id),
        apiKeyLabelId: r.api_key_label_id ? String(r.api_key_label_id) : undefined,
        priority: Number(r.priority || 1),
        isActive: Boolean(r.is_active),
        maxRetries: Number(r.max_retries ?? 2),
        timeoutMs: Number(r.timeout_ms ?? 30000),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
        providerName: provider ? String(provider.provider_name) : undefined,
        providerDisplayName: provider ? String(provider.display_name) : undefined,
        modelName: model ? String(model.model_name) : undefined,
        modelDisplayName: model ? String(model.display_name) : undefined,
        apiStyle: provider ? (provider.api_style as AiRoleModel['apiStyle']) : undefined,
        baseUrl: provider ? String(provider.base_url) : undefined,
        keyLabel: key ? String(key.label) : undefined,
      }
    })
  }

  // Fallback
  return DEFAULT_ROLE_MODELS.filter((rm) => !roleId || rm.roleId === roleId).map((rm) => {
    const model = DEFAULT_MODELS.find((m) => m.id === rm.modelId)
    const provider = model ? DEFAULT_PROVIDERS.find((p) => p.id === model.providerId) : undefined
    const key = DEFAULT_KEY_LABELS.find((k) => k.id === rm.apiKeyLabelId)
    return {
      ...rm,
      providerName: provider?.providerName,
      providerDisplayName: provider?.displayName,
      modelName: model?.modelName,
      modelDisplayName: model?.displayName,
      apiStyle: provider?.apiStyle,
      baseUrl: provider?.baseUrl,
      keyLabel: key?.label,
    }
  })
}

export async function createAiRoleModel(data: {
  roleId: string
  modelId: string
  apiKeyLabelId?: string
  priority?: number
  maxRetries?: number
  timeoutMs?: number
}): Promise<AiRoleModel | null> {
  const id = `rm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const now = new Date().toISOString()
  const payload = {
    id,
    role_id: data.roleId,
    model_id: data.modelId,
    api_key_label_id: data.apiKeyLabelId || null,
    priority: data.priority ?? 1,
    max_retries: data.maxRetries ?? 2,
    timeout_ms: data.timeoutMs ?? 30000,
    is_active: true,
    created_at: now,
    updated_at: now,
  }
  const rows = await querySupabase<Record<string, unknown>[]>('ai_role_models', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=representation' },
  })
  if (rows && rows[0]) {
    return {
      id: String(rows[0].id),
      roleId: String(rows[0].role_id),
      modelId: String(rows[0].model_id),
      apiKeyLabelId: rows[0].api_key_label_id ? String(rows[0].api_key_label_id) : undefined,
      priority: Number(rows[0].priority),
      isActive: Boolean(rows[0].is_active),
      maxRetries: Number(rows[0].max_retries),
      timeoutMs: Number(rows[0].timeout_ms),
      createdAt: String(rows[0].created_at),
      updatedAt: String(rows[0].updated_at),
    }
  }
  return null
}

export async function updateAiRoleModel(id: string, updates: Partial<AiRoleModel>): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.modelId !== undefined) payload.model_id = updates.modelId
  if (updates.priority !== undefined) payload.priority = updates.priority
  if (updates.apiKeyLabelId !== undefined) payload.api_key_label_id = updates.apiKeyLabelId || null
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  if (updates.maxRetries !== undefined) payload.max_retries = updates.maxRetries
  if (updates.timeoutMs !== undefined) payload.timeout_ms = updates.timeoutMs

  const res = await querySupabase(`ai_role_models?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

export async function deleteAiRoleModel(id: string): Promise<boolean> {
  const res = await querySupabase(`ai_role_models?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 6. Rule Configuration ───────────────────────────────────────────────────

export async function getAiRuleConfig(): Promise<AiRuleConfig> {
  const rows = await querySupabase<Record<string, unknown>[]>('ai_rule_config?id=eq.default&limit=1')
  if (rows && rows.length > 0) {
    const r = rows[0]
    return {
      id: String(r.id),
      factCheckerMin: Number(r.fact_checker_min ?? 90),
      seoMin: Number(r.seo_min ?? 80),
      imageMin: Number(r.image_min ?? 85),
      imageOptional: Boolean(r.image_optional ?? true),
      requireImage: Boolean(r.require_image ?? false),
      autoPublish: Boolean(r.auto_publish ?? true),
      maxItemsPerRun: Number(r.max_items_per_run ?? 10),
      updatedAt: String(r.updated_at),
    }
  }
  return inMemoryRuleConfig
}

export async function updateAiRuleConfig(updates: Partial<AiRuleConfig>): Promise<AiRuleConfig> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.factCheckerMin !== undefined) payload.fact_checker_min = updates.factCheckerMin
  if (updates.seoMin !== undefined) payload.seo_min = updates.seoMin
  if (updates.imageMin !== undefined) payload.image_min = updates.imageMin
  if (updates.imageOptional !== undefined) payload.image_optional = updates.imageOptional
  if (updates.requireImage !== undefined) payload.require_image = updates.requireImage
  if (updates.autoPublish !== undefined) payload.auto_publish = updates.autoPublish
  if (updates.maxItemsPerRun !== undefined) payload.max_items_per_run = updates.maxItemsPerRun

  const rows = await querySupabase<Record<string, unknown>[]>('ai_rule_config?id=eq.default', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { Prefer: 'return=representation' },
  })

  if (rows && rows.length > 0) {
    const r = rows[0]
    inMemoryRuleConfig = {
      id: String(r.id),
      factCheckerMin: Number(r.fact_checker_min ?? 90),
      seoMin: Number(r.seo_min ?? 80),
      imageMin: Number(r.image_min ?? 85),
      imageOptional: Boolean(r.image_optional ?? true),
      requireImage: Boolean(r.require_image ?? false),
      autoPublish: Boolean(r.auto_publish ?? true),
      maxItemsPerRun: Number(r.max_items_per_run ?? 10),
      updatedAt: String(r.updated_at),
    }
    return inMemoryRuleConfig
  }

  // Update in-memory fallback
  inMemoryRuleConfig = { ...inMemoryRuleConfig, ...updates, updatedAt: new Date().toISOString() }
  return inMemoryRuleConfig
}

// ─── 7. Jobs ──────────────────────────────────────────────────────────────────

export interface GetAiJobsParams {
  status?: AiJobStatus | 'all'
  limit?: number
  page?: number
}

export async function getAiJobs(params?: GetAiJobsParams): Promise<{ jobs: AiJob[]; total: number }> {
  const rawLimit = Number(params?.limit)
  const limit = !Number.isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20
  const rawPage = Number(params?.page)
  const page = !Number.isNaN(rawPage) && rawPage > 0 ? rawPage : 1
  const offset = (page - 1) * limit

  let endpoint = `ai_jobs?order=created_at.desc&limit=${limit}&offset=${offset}`
  if (params?.status && params.status !== 'all') {
    endpoint += `&status=eq.${encodeURIComponent(params.status)}`
  }

  const rows = await querySupabase<Record<string, unknown>[]>(endpoint)
  if (!rows) {
    return { jobs: [], total: 0 }
  }

  const jobs: AiJob[] = rows.map((r) => ({
    id: String(r.id),
    sourceId: r.source_id ? String(r.source_id) : undefined,
    sourceUrl: String(r.source_url),
    rawTitle: r.raw_title ? String(r.raw_title) : undefined,
    rawDescription: r.raw_description ? String(r.raw_description) : undefined,
    status: r.status as AiJobStatus,
    attempt: Number(r.attempt || 1),
    maxAttempts: r.max_attempts ? Number(r.max_attempts) : undefined,
    leaseExpiresAt: r.lease_expires_at ? String(r.lease_expires_at) : undefined,
    articleId: r.article_id ? String(r.article_id) : undefined,
    collectorResult: r.collector_result as AiJob['collectorResult'],
    writerResult: r.writer_result as AiJob['writerResult'],
    factCheckerResult: r.fact_checker_result as AiJob['factCheckerResult'],
    imageReviewerResult: r.image_reviewer_result as AiJob['imageReviewerResult'],
    seoReviewerResult: r.seo_reviewer_result as AiJob['seoReviewerResult'],
    duplicateCheckerResult: r.duplicate_checker_result as AiJob['duplicateCheckerResult'],
    ruleEngineResult: r.rule_engine_result as AiJob['ruleEngineResult'],
    holdReason: r.hold_reason ? String(r.hold_reason) : undefined,
    rejectReason: r.reject_reason ? String(r.reject_reason) : undefined,
    error: r.error ? String(r.error) : undefined,
    startedAt: r.started_at ? String(r.started_at) : undefined,
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }))

  // Accurate total for pagination: PostgREST exposes the filtered row count in
  // the `content-range` header of a count=exact request. Falls back to the page
  // length when the header is unavailable (e.g. Supabase not configured).
  let total = jobs.length
  const cfg = getSupabaseConfig()
  if (cfg) {
    try {
      const countEndpoint = `ai_jobs?select=id${
        params?.status && params.status !== 'all' ? `&status=eq.${encodeURIComponent(params.status)}` : ''
      }`
      const res = await fetch(`${cfg.url}/rest/v1/${countEndpoint}`, {
        method: 'HEAD',
        headers: { ...cfg.headers, Prefer: 'count=exact' },
        cache: 'no-store',
      })
      const contentRange = res.headers.get('content-range')
      if (contentRange) {
        const parsed = Number(contentRange.split('/')[1])
        if (!Number.isNaN(parsed)) total = parsed
      }
    } catch {
      // keep jobs.length fallback
    }
  }

  return { jobs, total }
}

export async function getAiJobById(id: string): Promise<AiJob | null> {
  const rows = await querySupabase<Record<string, unknown>[]>(`ai_jobs?id=eq.${encodeURIComponent(id)}&limit=1`)
  if (!rows || rows.length === 0) return null
  const r = rows[0]
  return {
    id: String(r.id),
    sourceId: r.source_id ? String(r.source_id) : undefined,
    sourceUrl: String(r.source_url),
    rawTitle: r.raw_title ? String(r.raw_title) : undefined,
    rawDescription: r.raw_description ? String(r.raw_description) : undefined,
    status: r.status as AiJobStatus,
    attempt: Number(r.attempt || 1),
    maxAttempts: r.max_attempts ? Number(r.max_attempts) : undefined,
    leaseExpiresAt: r.lease_expires_at ? String(r.lease_expires_at) : undefined,
    articleId: r.article_id ? String(r.article_id) : undefined,
    collectorResult: r.collector_result as AiJob['collectorResult'],
    writerResult: r.writer_result as AiJob['writerResult'],
    factCheckerResult: r.fact_checker_result as AiJob['factCheckerResult'],
    imageReviewerResult: r.image_reviewer_result as AiJob['imageReviewerResult'],
    seoReviewerResult: r.seo_reviewer_result as AiJob['seoReviewerResult'],
    duplicateCheckerResult: r.duplicate_checker_result as AiJob['duplicateCheckerResult'],
    ruleEngineResult: r.rule_engine_result as AiJob['ruleEngineResult'],
    holdReason: r.hold_reason ? String(r.hold_reason) : undefined,
    rejectReason: r.reject_reason ? String(r.reject_reason) : undefined,
    error: r.error ? String(r.error) : undefined,
    startedAt: r.started_at ? String(r.started_at) : undefined,
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }
}

export async function approveHeldJob(jobId: string): Promise<boolean> {
  const job = await getAiJobById(jobId)
  if (!job || !job.writerResult) return false

  const cfg = getSupabaseConfig()
  if (!cfg) return false

  let articleId = job.articleId

  if (articleId) {
    // Draft article was already created during pipeline HOLD stage — publish it
    await querySupabase(`articles?id=eq.${encodeURIComponent(articleId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'published',
        published_at: new Date().toISOString(),
      }),
      headers: { Prefer: 'return=minimal' },
    })
  } else {
    // No draft was created; insert new published article
    const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'
    // Respect the Rule Engine image decision: an image that failed review is
    // never re-attached at approval time, even for legacy held jobs.
    const imageUrl =
      job.ruleEngineResult?.imageApproved === false
        ? FALLBACK_IMAGE
        : job.imageReviewerResult?.approvedImageUrl || FALLBACK_IMAGE

    const articlePayload = {
      title: job.writerResult.headline,
      slug: job.writerResult.slug || `news-${Date.now()}`,
      summary: job.writerResult.summary,
      content: job.writerResult.body,
      category: job.writerResult.category || 'bangladesh',
      category_label: job.writerResult.categoryLabel || 'বাংলাদেশ',
      source_name: job.collectorResult?.sourceName || 'সংবাদচক্র',
      source_url: job.sourceUrl,
      image_url: imageUrl,
      published_at: new Date().toISOString(),
      is_breaking: false,
      status: 'published',
      author: { name: 'সংবাদচক্র অটোমেশন ডেস্ক', title: 'সম্পাদকীয় দল' },
      reading_time: job.writerResult.readingTime,
      tags: job.writerResult.tags,
      ai_job_id: jobId,
    }

    const artRes = await querySupabase<Record<string, unknown>[]>('articles', {
      method: 'POST',
      body: JSON.stringify(articlePayload),
      headers: { Prefer: 'return=representation' },
    })
    articleId = artRes && artRes[0]?.id ? String(artRes[0].id) : undefined
  }

  // Update job status to published
  await querySupabase(`ai_jobs?id=eq.${encodeURIComponent(jobId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'published',
      article_id: articleId,
      hold_reason: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    headers: { Prefer: 'return=minimal' },
  })

  return true
}

export async function rejectJob(jobId: string, reason: string): Promise<boolean> {
  const job = await getAiJobById(jobId)
  if (job?.articleId) {
    // If a draft article was created while on hold, delete it
    await querySupabase(`articles?id=eq.${encodeURIComponent(job.articleId)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    }).catch(() => undefined)
  }

  const res = await querySupabase(`ai_jobs?id=eq.${encodeURIComponent(jobId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'rejected',
      reject_reason: reason || 'Admin rejected',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    headers: { Prefer: 'return=minimal' },
  })
  return res !== null
}

// ─── 8. Pipeline Logs ─────────────────────────────────────────────────────────

export interface GetPipelineLogsParams {
  jobId?: string
  role?: string
  status?: string
  limit?: number
  page?: number
}

export async function getAiPipelineLogs(params?: GetPipelineLogsParams): Promise<AiPipelineLog[]> {
  const rawLimit = Number(params?.limit)
  const limit = !Number.isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50
  const rawPage = Number(params?.page)
  const page = !Number.isNaN(rawPage) && rawPage > 0 ? rawPage : 1
  const offset = (page - 1) * limit

  let endpoint = `ai_pipeline_logs?order=created_at.desc&limit=${limit}&offset=${offset}`
  if (params?.jobId) endpoint += `&job_id=eq.${encodeURIComponent(params.jobId)}`
  if (params?.role) endpoint += `&role=eq.${encodeURIComponent(params.role)}`
  if (params?.status) endpoint += `&status=eq.${encodeURIComponent(params.status)}`

  const rows = await querySupabase<Record<string, unknown>[]>(endpoint)
  if (!rows) return []

  return rows.map((r) => ({
    id: String(r.id),
    jobId: String(r.job_id),
    role: r.role as AiPipelineLog['role'],
    provider: r.provider ? String(r.provider) : undefined,
    model: r.model ? String(r.model) : undefined,
    apiKeyLabel: r.api_key_label ? String(r.api_key_label) : undefined,
    status: r.status as AiPipelineLog['status'],
    score: r.score !== undefined && r.score !== null ? Number(r.score) : undefined,
    decision: r.decision ? String(r.decision) : undefined,
    attempt: Number(r.attempt || 1),
    promptTokens: r.prompt_tokens ? Number(r.prompt_tokens) : undefined,
    completionTokens: r.completion_tokens ? Number(r.completion_tokens) : undefined,
    latencyMs: r.latency_ms ? Number(r.latency_ms) : undefined,
    error: r.error ? String(r.error) : undefined,
    createdAt: String(r.created_at),
  }))
}

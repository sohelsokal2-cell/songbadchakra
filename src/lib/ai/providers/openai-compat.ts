/**
 * OpenAI-compatible API Adapter
 * Used for: Groq, OpenRouter, NVIDIA NIM (all use the same /chat/completions interface).
 * Provider-specific headers/URLs are passed as parameters.
 */

import type {
  ProviderMessage,
  ProviderCallOptions,
  ProviderResponse,
} from '@/types/ai'

interface OpenAiCallParams {
  baseUrl: string
  apiKey: string
  modelName: string
  messages: ProviderMessage[]
  options?: ProviderCallOptions
  providerName: string
  extraHeaders?: Record<string, string>
}

export async function callOpenAiCompat({
  baseUrl,
  apiKey,
  modelName,
  messages,
  options = {},
  providerName,
  extraHeaders = {},
}: OpenAiCallParams): Promise<ProviderResponse> {
  const {
    temperature = 0.2,
    maxTokens = 2048,
    timeoutMs = 30000,
    responseFormat = 'json',
  } = options

  const startMs = Date.now()

  const body: Record<string, unknown> = {
    model: modelName,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat === 'json'
      ? { response_format: { type: 'json_object' } }
      : {}),
  }

  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const cleanBase = baseUrl.trim().replace(/\/+$/, '')
    const url = cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : cleanBase.endsWith('/v1')
      ? `${cleanBase}/chat/completions`
      : `${cleanBase}/v1/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`${providerName} HTTP ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      throw new Error(`${providerName} returned empty content.`)
    }

    return {
      text,
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      latencyMs: Date.now() - startMs,
      provider: providerName,
      model: modelName,
    }
  } finally {
    clearTimeout(timerId)
  }
}

// Groq-specific wrapper
export async function callGroq(
  modelName: string,
  apiKey: string,
  messages: ProviderMessage[],
  options?: ProviderCallOptions
): Promise<ProviderResponse> {
  return callOpenAiCompat({
    baseUrl: 'https://api.groq.com/openai',
    apiKey,
    modelName,
    messages,
    options,
    providerName: 'groq',
  })
}

// OpenRouter-specific wrapper
export async function callOpenRouter(
  modelName: string,
  apiKey: string,
  messages: ProviderMessage[],
  options?: ProviderCallOptions
): Promise<ProviderResponse> {
  return callOpenAiCompat({
    baseUrl: 'https://openrouter.ai/api',
    apiKey,
    modelName,
    messages,
    options,
    providerName: 'openrouter',
    extraHeaders: {
      'HTTP-Referer': 'https://songbadchakra.com.bd',
      'X-Title': 'SongbadChakra',
    },
  })
}

// NVIDIA NIM-specific wrapper
export async function callNvidia(
  modelName: string,
  apiKey: string,
  messages: ProviderMessage[],
  options?: ProviderCallOptions
): Promise<ProviderResponse> {
  return callOpenAiCompat({
    baseUrl: 'https://integrate.api.nvidia.com',
    apiKey,
    modelName,
    messages,
    options,
    providerName: 'nvidia',
  })
}

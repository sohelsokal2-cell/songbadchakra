/**
 * Gemini API Adapter
 * Calls Google Gemini REST API directly (no SDK dependency).
 * Supports: gemini-1.5-flash, gemini-1.5-flash-8b, gemini-2.0-flash, etc.
 */

import type {
  ProviderMessage,
  ProviderCallOptions,
  ProviderResponse,
} from '@/types/ai'

export async function callGemini(
  modelName: string,
  apiKey: string,
  messages: ProviderMessage[],
  options: ProviderCallOptions = {}
): Promise<ProviderResponse> {
  const {
    temperature = 0.2,
    maxTokens = 2048,
    timeoutMs = 30000,
    responseFormat = 'json',
  } = options

  const startMs = Date.now()

  // Convert messages to Gemini contents format
  // Gemini uses system instruction separately
  const systemMsg = messages.find((m) => m.role === 'system')
  const userMessages = messages.filter((m) => m.role !== 'system')

  const contents = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
    },
  }

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    }
  }

  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const candidate = data?.candidates?.[0]
    const finishReason = candidate?.finishReason
    const text = candidate?.content?.parts?.[0]?.text
    if (!text) {
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          `Gemini model "${modelName}" hit MAX_TOKENS limit with empty output. ` +
          'This model may have a very low token budget in the current API tier. ' +
          'Try a different model (e.g. gemini-2.5-flash).'
        )
      }
      throw new Error(`Gemini returned empty content. finishReason: ${finishReason ?? 'unknown'}`)
    }

    return {
      text,
      promptTokens: data?.usageMetadata?.promptTokenCount,
      completionTokens: data?.usageMetadata?.candidatesTokenCount,
      latencyMs: Date.now() - startMs,
      provider: 'gemini',
      model: modelName,
    }
  } finally {
    clearTimeout(timerId)
  }
}

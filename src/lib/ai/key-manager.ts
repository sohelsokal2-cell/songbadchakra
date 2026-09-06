/**
 * API Key Manager
 *
 * SECURITY: API keys are NEVER stored in the database.
 * The database stores only a label (env var name, e.g. "GROQ_API_KEY").
 * The actual secret lives in Cloudflare Secrets / .env.local.
 *
 * This module resolves labels to their actual values from the environment.
 * Keys are NEVER returned in HTTP responses or logs.
 */

/**
 * Resolve an API key label to its actual value from environment variables.
 * Returns null if the label is not set.
 */
export function resolveApiKey(label: string): string | null {
  if (!label) return null
  // Sanitize label: only allow uppercase letters, digits, underscores
  const safeLabel = label.replace(/[^A-Z0-9_]/g, '')
  if (safeLabel !== label) return null
  const value = process.env[safeLabel]
  return value && value.trim() ? value.trim() : null
}

/**
 * Returns a masked display version of a key for admin UI.
 * NEVER exposes the full value.
 */
export function maskKeyLabel(label: string): string {
  // Just show what env var name it maps to, not the value
  return `${label} (env var)`
}

/**
 * Check if a key label is currently resolvable (env var is set and non-empty).
 */
export function isKeyAvailable(label: string): boolean {
  return resolveApiKey(label) !== null
}

/**
 * Returns whether an env var is set, and a safely masked representation
 */
export function getMaskedEnvVarStatus(label: string): { isSet: boolean; maskedValue: string } {
  const val = resolveApiKey(label)
  if (!val) return { isSet: false, maskedValue: 'Not set in environment' }
  if (val.length <= 8) return { isSet: true, maskedValue: '********' }
  const head = val.slice(0, 3)
  const tail = val.slice(-3)
  return { isSet: true, maskedValue: `${head}****${tail}` }
}

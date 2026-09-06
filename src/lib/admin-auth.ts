import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE_NAME = 'songbadchakra_admin_token'

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_CLOCK_SKEW_MS = 60 * 1000

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET

  if (!email || !password || !sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET (at least 32 characters) must be configured.'
    )
  }

  return { email, password, sessionSecret }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function validateCredentials(email: string, password: string): boolean {
  const config = getAdminConfig()
  return (
    safeEqual(email.trim().toLowerCase(), config.email.trim().toLowerCase()) &&
    safeEqual(password, config.password)
  )
}

export function generateSessionToken(email: string): string {
  const { sessionSecret } = getAdminConfig()
  const payload = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), issuedAt: Date.now() })
  ).toString('base64url')
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySessionToken(token?: string): { valid: boolean; email?: string } {
  if (!token) return { valid: false }

  try {
    const { sessionSecret } = getAdminConfig()
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra) return { valid: false }

    const expectedSignature = createHmac('sha256', sessionSecret).update(payload).digest('base64url')
    if (!safeEqual(signature, expectedSignature)) return { valid: false }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email?: unknown
      issuedAt?: unknown
    }
    if (typeof parsed.email !== 'string' || typeof parsed.issuedAt !== 'number') {
      return { valid: false }
    }

    const age = Date.now() - parsed.issuedAt
    if (age < -MAX_CLOCK_SKEW_MS || age > SESSION_MAX_AGE_MS) return { valid: false }

    return { valid: true, email: parsed.email }
  } catch {
    return { valid: false }
  }
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return verifySessionToken(token).valid
}

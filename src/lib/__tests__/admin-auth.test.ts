/**
 * Tests for admin authentication: HMAC token generation, verification,
 * credential validation, expiry, clock skew, and tamper detection.
 */
import { createHmac } from 'crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  validateCredentials,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/admin-auth'

// Test environment setup
const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'test-password-secure'
const TEST_SECRET = 'this-is-a-32-character-test-secret!'

function setEnv() {
  process.env.ADMIN_EMAIL = TEST_EMAIL
  process.env.ADMIN_PASSWORD = TEST_PASSWORD
  process.env.ADMIN_SESSION_SECRET = TEST_SECRET
}

function clearEnv() {
  delete process.env.ADMIN_EMAIL
  delete process.env.ADMIN_PASSWORD
  delete process.env.ADMIN_SESSION_SECRET
}

describe('validateCredentials', () => {
  beforeEach(setEnv)
  afterEach(clearEnv)

  it('returns true with correct credentials', () => {
    expect(validateCredentials(TEST_EMAIL, TEST_PASSWORD)).toBe(true)
  })

  it('returns true with mixed-case email (case-insensitive)', () => {
    expect(validateCredentials(TEST_EMAIL.toUpperCase(), TEST_PASSWORD)).toBe(true)
  })

  it('returns false with wrong password', () => {
    expect(validateCredentials(TEST_EMAIL, 'wrong-password')).toBe(false)
  })

  it('returns false with wrong email', () => {
    expect(validateCredentials('wrong@test.com', TEST_PASSWORD)).toBe(false)
  })

  it('returns false with empty credentials', () => {
    expect(validateCredentials('', '')).toBe(false)
  })
})

describe('generateSessionToken + verifySessionToken', () => {
  beforeEach(setEnv)
  afterEach(clearEnv)

  it('generates a token that verifies successfully', () => {
    const token = generateSessionToken(TEST_EMAIL)
    const result = verifySessionToken(token)
    expect(result.valid).toBe(true)
    expect(result.email).toBe(TEST_EMAIL.toLowerCase())
  })

  it('returns invalid for empty token', () => {
    expect(verifySessionToken(undefined).valid).toBe(false)
    expect(verifySessionToken('').valid).toBe(false)
  })

  it('returns invalid for a tampered payload', () => {
    const token = generateSessionToken(TEST_EMAIL)
    const [, sig] = token.split('.')
    const tampered = Buffer.from(
      JSON.stringify({ email: 'hacker@evil.com', issuedAt: Date.now() })
    ).toString('base64url')
    expect(verifySessionToken(`${tampered}.${sig}`).valid).toBe(false)
  })

  it('returns invalid for a tampered signature', () => {
    const token = generateSessionToken(TEST_EMAIL)
    const [payload] = token.split('.')
    expect(verifySessionToken(`${payload}.invalidsignature`).valid).toBe(false)
  })

  it('returns invalid for token with extra segments', () => {
    const token = generateSessionToken(TEST_EMAIL)
    expect(verifySessionToken(`${token}.extra`).valid).toBe(false)
  })

  it('returns invalid for an expired token', () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000 - 1000
    const payload = Buffer.from(
      JSON.stringify({ email: TEST_EMAIL, issuedAt: sevenDaysAgo })
    ).toString('base64url')
    const sig = createHmac('sha256', TEST_SECRET).update(payload).digest('base64url')
    expect(verifySessionToken(`${payload}.${sig}`).valid).toBe(false)
  })

  it('returns invalid for a future-issued token beyond clock skew', () => {
    const farFuture = Date.now() + 2 * 60 * 1000 // 2 minutes into the future
    const payload = Buffer.from(
      JSON.stringify({ email: TEST_EMAIL, issuedAt: farFuture })
    ).toString('base64url')
    const sig = createHmac('sha256', TEST_SECRET).update(payload).digest('base64url')
    expect(verifySessionToken(`${payload}.${sig}`).valid).toBe(false)
  })

  it('accepts a token within allowed clock skew (30s in the future)', () => {
    const slightFuture = Date.now() + 30 * 1000 // 30 seconds ahead
    const payload = Buffer.from(
      JSON.stringify({ email: TEST_EMAIL, issuedAt: slightFuture })
    ).toString('base64url')
    const sig = createHmac('sha256', TEST_SECRET).update(payload).digest('base64url')
    expect(verifySessionToken(`${payload}.${sig}`).valid).toBe(true)
  })
})

describe('missing environment configuration', () => {
  afterEach(clearEnv)

  it('throws when ADMIN_SESSION_SECRET is missing', () => {
    process.env.ADMIN_EMAIL = TEST_EMAIL
    process.env.ADMIN_PASSWORD = TEST_PASSWORD
    // No ADMIN_SESSION_SECRET
    expect(() => validateCredentials(TEST_EMAIL, TEST_PASSWORD)).toThrow()
  })

  it('throws when ADMIN_SESSION_SECRET is too short', () => {
    process.env.ADMIN_EMAIL = TEST_EMAIL
    process.env.ADMIN_PASSWORD = TEST_PASSWORD
    process.env.ADMIN_SESSION_SECRET = 'short'
    expect(() => validateCredentials(TEST_EMAIL, TEST_PASSWORD)).toThrow()
  })
})

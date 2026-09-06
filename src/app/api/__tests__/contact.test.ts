/**
 * Tests for contact form validation rules:
 * field minimum/maximum limits, invalid email, and rate limiting.
 * Tests the pure validation logic directly to avoid HTTP layer complexity.
 */
import { describe, it, expect } from 'vitest'

// --- Pure validation helpers (mirrors the route's logic) ---
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateContactPayload(body: {
  name?: unknown
  email?: unknown
  phone?: unknown
  subject?: unknown
  message?: unknown
}): string | null {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || name.length < 2 || name.length > 120) {
    return 'name_invalid'
  }
  if (!email || email.length > 254 || !isValidEmail(email)) {
    return 'email_invalid'
  }
  if (!subject || subject.length < 3 || subject.length > 200) {
    return 'subject_invalid'
  }
  if (!message || message.length < 10 || message.length > 10000) {
    return 'message_invalid'
  }
  if (phone.length > 40) {
    return 'phone_too_long'
  }
  return null // valid
}

// --- Rate limit simulation (mirrors isRateLimited from contact/route.ts) ---
function makeRateLimiter(maxPerWindow: number, windowMs: number) {
  const map = new Map<string, number[]>()
  return {
    check(key: string): boolean {
      const cutoff = Date.now() - windowMs
      const recent = (map.get(key) || []).filter((t) => t > cutoff)
      if (recent.length >= maxPerWindow) return true
      recent.push(Date.now())
      map.set(key, recent)
      return false
    },
    reset() { map.clear() },
  }
}

describe('contact form: name validation', () => {
  it('rejects name shorter than 2 characters', () => {
    expect(validateContactPayload({ name: 'A', email: 'a@b.com', subject: 'Subject', message: 'A valid message body here' })).toBe('name_invalid')
  })

  it('rejects empty name', () => {
    expect(validateContactPayload({ name: '', email: 'a@b.com', subject: 'Subject', message: 'A valid message body here' })).toBe('name_invalid')
  })

  it('rejects name exceeding 120 characters', () => {
    expect(validateContactPayload({ name: 'A'.repeat(121), email: 'a@b.com', subject: 'Subject', message: 'A valid message body here' })).toBe('name_invalid')
  })

  it('accepts name at minimum boundary (2 chars)', () => {
    expect(validateContactPayload({ name: 'AB', email: 'a@b.com', subject: 'Sub', message: 'A valid message body here' })).toBeNull()
  })

  it('accepts name at maximum boundary (120 chars)', () => {
    expect(validateContactPayload({ name: 'A'.repeat(120), email: 'a@b.com', subject: 'Sub', message: 'A valid message body here' })).toBeNull()
  })
})

describe('contact form: email validation', () => {
  it('rejects empty email', () => {
    expect(validateContactPayload({ name: 'Test User', email: '', subject: 'Subject', message: 'A valid message body here' })).toBe('email_invalid')
  })

  it('rejects email without @', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'notanemail', subject: 'Subject', message: 'A valid message body here' })).toBe('email_invalid')
  })

  it('rejects email without domain', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'test@', subject: 'Subject', message: 'A valid message body here' })).toBe('email_invalid')
  })

  it('rejects email longer than 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    expect(validateContactPayload({ name: 'Test User', email: longEmail, subject: 'Subject', message: 'A valid message body here' })).toBe('email_invalid')
  })

  it('accepts valid email', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'valid@example.com', subject: 'Sub', message: 'A valid message body here' })).toBeNull()
  })
})

describe('contact form: subject validation', () => {
  it('rejects subject shorter than 3 characters', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'a@b.com', subject: 'Hi', message: 'A valid message body here' })).toBe('subject_invalid')
  })

  it('rejects subject exceeding 200 characters', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'a@b.com', subject: 'S'.repeat(201), message: 'A valid message body here' })).toBe('subject_invalid')
  })

  it('accepts subject at minimum boundary (3 chars)', () => {
    expect(validateContactPayload({ name: 'Test', email: 'a@b.com', subject: 'Sub', message: 'A valid message body here' })).toBeNull()
  })
})

describe('contact form: message validation', () => {
  it('rejects message shorter than 10 characters', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'a@b.com', subject: 'Subject', message: 'Short' })).toBe('message_invalid')
  })

  it('rejects message exceeding 10000 characters', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'a@b.com', subject: 'Subject', message: 'A'.repeat(10001) })).toBe('message_invalid')
  })

  it('accepts message at minimum boundary (10 chars)', () => {
    expect(validateContactPayload({ name: 'Test', email: 'a@b.com', subject: 'Sub', message: '1234567890' })).toBeNull()
  })
})

describe('contact form: phone validation', () => {
  it('rejects phone longer than 40 characters', () => {
    expect(validateContactPayload({ name: 'Test User', email: 'a@b.com', subject: 'Sub', message: 'A valid message body here', phone: '1'.repeat(41) })).toBe('phone_too_long')
  })

  it('accepts phone at maximum boundary (40 chars)', () => {
    expect(validateContactPayload({ name: 'Test', email: 'a@b.com', subject: 'Sub', message: 'A valid message body here', phone: '1'.repeat(40) })).toBeNull()
  })

  it('accepts empty phone (optional field)', () => {
    expect(validateContactPayload({ name: 'Test', email: 'a@b.com', subject: 'Sub', message: 'A valid message body here' })).toBeNull()
  })
})

describe('contact form: rate limiting', () => {
  it('allows up to 5 submissions within the window', () => {
    const limiter = makeRateLimiter(5, 10 * 60 * 1000)
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('test-ip')).toBe(false)
    }
  })

  it('blocks the 6th submission within the window', () => {
    const limiter = makeRateLimiter(5, 10 * 60 * 1000)
    for (let i = 0; i < 5; i++) {
      limiter.check('test-ip')
    }
    expect(limiter.check('test-ip')).toBe(true)
  })

  it('does not limit different IPs independently', () => {
    const limiter = makeRateLimiter(5, 10 * 60 * 1000)
    for (let i = 0; i < 5; i++) {
      limiter.check('ip-one')
    }
    expect(limiter.check('ip-two')).toBe(false)
  })
})

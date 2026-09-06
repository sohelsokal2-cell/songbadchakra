import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAiJobs } from '@/lib/ai/ai-repository'

describe('getAiJobs pagination total', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.test')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('uses the filtered count from content-range, not the page length', async () => {
    const row = {
      id: 'job-1',
      source_url: 'https://news.com/a',
      status: 'failed',
      attempt: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const fetchMock = vi
      .fn()
      // 1st call: page of rows
      .mockResolvedValueOnce(new Response(JSON.stringify([row]), { status: 200 }))
      // 2nd call: count=exact HEAD
      .mockResolvedValueOnce(
        new Response(null, { status: 200, headers: { 'content-range': '0-0/57' } })
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAiJobs({ status: 'failed', limit: 1, page: 1 })
    expect(result.jobs).toHaveLength(1)
    expect(result.total).toBe(57)

    // Count request must preserve the status filter.
    const countUrl = fetchMock.mock.calls[1][0] as string
    expect(countUrl).toContain('status=eq.failed')
  })

  it('falls back to page length when content-range is missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getAiJobs({ limit: 20, page: 1 })
    expect(result.jobs).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
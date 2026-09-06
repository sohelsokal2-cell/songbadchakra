import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isInProgressStatus,
  jobToFeedItem,
  claimQueuedJob,
} from '@/lib/ai/job-recovery'

describe('Job Recovery & Retry Engine', () => {
  describe('isInProgressStatus', () => {
    it('treats stage states as in-progress', () => {
      expect(isInProgressStatus('writing')).toBe(true)
      expect(isInProgressStatus('rule_checking')).toBe(true)
      expect(isInProgressStatus('retrying')).toBe(true)
    })

    it('treats terminal states as not in-progress', () => {
      expect(isInProgressStatus('published')).toBe(false)
      expect(isInProgressStatus('held')).toBe(false)
      expect(isInProgressStatus('rejected')).toBe(false)
      expect(isInProgressStatus('failed')).toBe(false)
      expect(isInProgressStatus('dead_letter')).toBe(false)
    })
  })

  describe('jobToFeedItem', () => {
    it('maps an ai_jobs row back to a ParsedFeedItem for re-processing', () => {
      const job = {
        id: 'job-1',
        sourceUrl: 'https://news.com/item',
        rawTitle: 'শিরোনাম',
        rawDescription: 'বিবরণ',
      }
      const item = jobToFeedItem(job as never)
      expect(item.link).toBe('https://news.com/item')
      expect(item.title).toBe('শিরোনাম')
      expect(item.description).toBe('বিবরণ')
    })

    it('tolerates missing raw fields', () => {
      const item = jobToFeedItem({ id: 'job-2', sourceUrl: 'https://news.com/x' } as never)
      expect(item.link).toBe('https://news.com/x')
      expect(item.title).toBe('')
      expect(item.description).toBe('')
    })
  })

  describe('claimQueuedJob (atomic claim)', () => {
    const ENV = {
      url: 'https://supabase.test',
      key: 'service-role-key',
    }

    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', ENV.url)
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', ENV.key)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.restoreAllMocks()
    })

    it('returns true only when the conditional PATCH matched a row', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ id: 'job-1' }]), { status: 200 })
      )
      vi.stubGlobal('fetch', fetchMock)

      await expect(claimQueuedJob('job-1')).resolves.toBe(true)

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('ai_jobs?id=eq.job-1')
      // Claim is conditional: still queued AND lease absent/expired.
      expect(url).toContain('status=eq.queued')
      expect(url).toContain('or=(lease_expires_at.is.null,lease_expires_at.lte.')
      expect(init.method).toBe('PATCH')
      expect((init.headers as Record<string, string>).Prefer).toContain('return=representation')
    })

    it('returns false when the row was already claimed (empty match)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })))
      await expect(claimQueuedJob('job-1')).resolves.toBe(false)
    })

    it('returns false when the request fails (conservative skip)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
      await expect(claimQueuedJob('job-1')).resolves.toBe(false)
    })
  })
})
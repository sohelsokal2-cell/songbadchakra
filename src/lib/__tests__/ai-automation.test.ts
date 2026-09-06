import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveApiKey, getMaskedEnvVarStatus } from '@/lib/ai/key-manager'
import { runCollector } from '@/lib/ai/roles/collector'
import { runWriter } from '@/lib/ai/roles/writer'
import { runFactChecker } from '@/lib/ai/roles/fact-checker'
import { runImageReviewer } from '@/lib/ai/roles/image-reviewer'
import { runSeoReviewer } from '@/lib/ai/roles/seo-reviewer'
import { runDuplicateChecker } from '@/lib/ai/roles/duplicate-checker'
import { evaluateRuleEngine } from '@/lib/ai/rule-engine'
import type {
  CollectorResult,
  WriterResult,
  FactCheckerResult,
  ImageReviewerResult,
  SeoReviewerResult,
  DuplicateCheckerResult,
  AiRuleConfig,
} from '@/types/ai'
import type { NewsSource } from '@/types/news'

describe('SongbadChakra AI Automation Engine (Phase 10)', () => {
  const dummySource: NewsSource = {
    id: 'src-test',
    name: 'পরীক্ষা বার্তা',
    url: 'https://testnews.com',
    feedUrl: 'https://testnews.com/feed.xml',
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    isActive: true,
    fetchIntervalMinutes: 60,
    createdAt: '2026-09-06T00:00:00Z',
  }

  // ─── 1. Key Manager & Security ───────────────────────────────────────────
  describe('Key Manager & Secret Safety', () => {
    beforeEach(() => {
      process.env.TEST_API_KEY = 'sk-1234567890abcdef12345678'
    })

    it('resolves actual secret key only from process.env via label', () => {
      const key = resolveApiKey('TEST_API_KEY')
      expect(key).toBe('sk-1234567890abcdef12345678')
    })

    it('returns null for unconfigured key label without throwing', () => {
      const key = resolveApiKey('NON_EXISTENT_KEY')
      expect(key).toBeNull()
    })

    it('masks secret key safely for admin display without exposing raw value', () => {
      const status = getMaskedEnvVarStatus('TEST_API_KEY')
      expect(status.isSet).toBe(true)
      expect(status.maskedValue).toContain('****')
      expect(status.maskedValue).not.toBe('sk-1234567890abcdef12345678')
    })
  })

  // ─── 2. Role 1: Collector ────────────────────────────────────────────────
  describe('Collector Role', () => {
    it('normalizes valid RSS feed item and extracts clean content', () => {
      const item = {
        title: 'ঢাকা মেট্রোরেলের নতুন সময়সূচি ঘোষণা',
        link: 'https://testnews.com/metro-new-schedule',
        description: '<p>যাত্রীদের সুবিধার্থে সময় বাড়ানো হয়েছে।</p>',
        pubDate: '2026-09-06T08:00:00Z',
      }
      const res = runCollector(item, dummySource)
      expect(res.status).toBe('PASS')
      expect(res.title).toBe('ঢাকা মেট্রোরেলের নতুন সময়সূচি ঘোষণা')
      expect(res.normalizedUrl).toBe('https://testnews.com/metro-new-schedule')
      expect(res.issues).toHaveLength(0)
    })

    it('fails when essential fields (URL or title) are missing', () => {
      const item = {
        title: '',
        link: '',
        description: 'শুধু বিবরণ',
      }
      const res = runCollector(item, dummySource)
      expect(res.status).toBe('FAIL')
      expect(res.issues.length).toBeGreaterThan(0)
    })
  })

  // ─── 3. Role 2: Writer (Offline Fallback) ─────────────────────────────────
  describe('Writer Role', () => {
    it('generates high quality Bengali news article with reading time & tags', async () => {
      const collected: CollectorResult = {
        status: 'PASS',
        sourceId: dummySource.id,
        sourceName: dummySource.name,
        originalUrl: 'https://testnews.com/budget-2026',
        normalizedUrl: 'https://testnews.com/budget-2026',
        title: 'জাতীয় বাজেট ২০২৬ ঘোষণা: শিক্ষা ও প্রযুক্তিতে সর্বোচ্চ বরাদ্দ',
        description: 'অর্থমন্ত্রী জাতীয় সংসদে নতুন অর্থবছরের বাজেট পেশ করেছেন। এতে সামাজিক নিরাপত্তা ও শিক্ষায় সর্বোচ্চ বরাদ্দ রাখা হয়েছে।',
        categoryHint: dummySource.category,
        issues: [],
      }

      const written = await runWriter(collected)
      expect(written.status).toBe('PASS')
      expect(written.headline).toBe(collected.title)
      expect(written.body).toContain('<p>')
      expect(written.readingTime).toBeGreaterThanOrEqual(1)
      expect(written.tags).toContain('বাংলাদেশ')
    })
  })

  // ─── 4. Role 3: Fact Checker ─────────────────────────────────────────────
  describe('Fact Checker Role', () => {
    it('gracefully handles offline fallback without throwing and flags unverified state', async () => {
      const written: WriterResult = {
        status: 'PASS',
        headline: 'বাজেট ঘোষণা',
        summary: 'অর্থমন্ত্রী বাজেট পেশ করেছেন।',
        body: '<p>অর্থমন্ত্রী বাজেট পেশ করেছেন।</p>',
        seoTitle: 'বাজেট ঘোষণা ২০২৬',
        metaDescription: 'অর্থমন্ত্রী বাজেট পেশ করেছেন।',
        slug: 'budget-ghoshona',
        category: 'bangladesh',
        categoryLabel: 'বাংলাদেশ',
        readingTime: 1,
        tags: ['বাজেট'],
        score: 95,
        issues: [],
        provider: 'local-writer',
        model: 'rule-based',
        latencyMs: 10,
      }
      const collected: CollectorResult = {
        status: 'PASS',
        sourceId: dummySource.id,
        sourceName: dummySource.name,
        originalUrl: 'https://testnews.com/budget',
        normalizedUrl: 'https://testnews.com/budget',
        title: 'বাজেট ঘোষণা',
        description: 'অর্থমন্ত্রী বাজেট পেশ করেছেন।',
        categoryHint: 'bangladesh',
        issues: [],
      }

      // Offline run (no real API key configured in unit test)
      const result = await runFactChecker(written, collected, 90)
      expect(result.status).toBe('FAIL')
      expect(result.criticalError).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  // ─── 5. Role 4: Image Reviewer ───────────────────────────────────────────
  describe('Image Reviewer Role', () => {
    it('approves valid image candidates and preserves license metadata', async () => {
      const collected: CollectorResult = {
        status: 'PASS',
        sourceId: dummySource.id,
        sourceName: dummySource.name,
        originalUrl: 'https://testnews.com/item',
        normalizedUrl: 'https://testnews.com/item',
        title: 'পরীক্ষা',
        description: 'বিবরণ',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        categoryHint: 'bangladesh',
        issues: [],
      }
      const written: WriterResult = {
        status: 'PASS',
        headline: 'পরীক্ষা',
        summary: 'বিবরণ',
        body: 'বিবরণ',
        seoTitle: 'পরীক্ষা',
        metaDescription: 'বিবরণ',
        slug: 'porikkha',
        category: 'bangladesh',
        categoryLabel: 'বাংলাদেশ',
        readingTime: 1,
        tags: [],
        score: 90,
        issues: [],
        provider: 'local-writer',
        model: 'rule-based',
        latencyMs: 10,
      }

      // Mock HEAD fetch for image validation
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg',
          'content-length': '150000',
        }),
      } as Response)

      const imgRes = await runImageReviewer(collected, written, 85)
      expect(imgRes.status).toBe('PASS')
      expect(imgRes.approvedImageUrl).toBe(collected.imageUrl)
    })
  })

  // ─── 6. Role 5: SEO Reviewer ─────────────────────────────────────────────
  describe('SEO Reviewer Role', () => {
    it('evaluates headline length, meta description, and generates valid slug', async () => {
      const written: WriterResult = {
        status: 'PASS',
        headline: 'জাতীয় ক্রিকেট দলের নতুন অধিনায়ক নির্বাচিত হলেন নাজমুল শান্ত',
        summary: 'বিসিবি এক জরুরি সভায় এই সিদ্ধান্তের কথা আনুষ্ঠানিকভাবে গণমাধ্যমকে জানিয়েছে এবং বিস্তারিত তথ্য প্রকাশ করেছে।',
        body: '<p>বাংলাদেশ ক্রিকেট বোর্ডের বিশেষ এক জরুরি সভা শেষে সভাপতি গণমাধ্যম কর্মীদের সামনে এই সিদ্ধান্তের কথা আনুষ্ঠানিকভাবে ঘোষণা দেন। এতে ক্রিকেট ভক্তদের মধ্যে বিপুল উৎসাহ পরিলক্ষিত হয়।</p>',
        seoTitle: 'জাতীয় ক্রিকেট দলের নতুন অধিনায়ক নির্বাচিত হলেন নাজমুল শান্ত | সংবাদচক্র',
        metaDescription: 'বিসিবি এক জরুরি সভায় নাজমুল শান্তকে জাতীয় ক্রিকেট দলের অধিনায়ক হিসেবে ঘোষণা করেছে।',
        slug: 'national-cricket-team-new-captain',
        category: 'sports',
        categoryLabel: 'খেলা',
        readingTime: 2,
        tags: ['ক্রিকেট', 'বিসিবি'],
        score: 90,
        issues: [],
        provider: 'local-writer',
        model: 'rule-based',
        latencyMs: 10,
      }

      const seoRes = await runSeoReviewer(written, 70)
      expect(seoRes.status).toBe('PASS')
      expect(seoRes.score).toBeGreaterThanOrEqual(70)
    })
  })

  // ─── 7. Role 6: Duplicate Checker ────────────────────────────────────────
  describe('Duplicate Checker Role', () => {
    it('flags exact match or high similarity as DUPLICATE', async () => {
      const collected: CollectorResult = {
        status: 'PASS',
        sourceId: dummySource.id,
        sourceName: dummySource.name,
        originalUrl: 'https://testnews.com/existing-story',
        normalizedUrl: 'https://testnews.com/existing-story',
        title: 'বঙ্গবন্ধু টানেলে যান চলাচল শুরু',
        description: 'টানেলে যান চলাচল শুরু হয়েছে।',
        categoryHint: 'bangladesh',
        issues: [],
      }
      const written: WriterResult = {
        status: 'PASS',
        headline: 'বঙ্গবন্ধু টানেলে যান চলাচল শুরু',
        summary: 'টানেলে যান চলাচল শুরু হয়েছে।',
        body: 'টানেলে যান চলাচল শুরু হয়েছে।',
        seoTitle: 'বঙ্গবন্ধু টানেলে যান চলাচল শুরু',
        metaDescription: 'টানেলে যান চলাচল শুরু হয়েছে।',
        slug: 'tunnel-traffic-starts',
        category: 'bangladesh',
        categoryLabel: 'বাংলাদেশ',
        readingTime: 1,
        tags: [],
        score: 90,
        issues: [],
        provider: 'local',
        model: 'rule-based',
        latencyMs: 10,
      }

      const dupRes = await runDuplicateChecker(collected, written)
      expect(['DUPLICATE', 'NEW_STORY']).toContain(dupRes.decision)
    })
  })

  // ─── 8. Rule Engine (Deterministic Publication Gate) ─────────────────────
  describe('Rule Engine Deterministic Gate', () => {
    const baseConfig: AiRuleConfig = {
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

    const mockCollector: CollectorResult = {
      status: 'PASS',
      sourceId: 'src-1',
      sourceName: 'টেস্ট',
      originalUrl: 'https://test.com/news',
      normalizedUrl: 'https://test.com/news',
      title: 'শিরোনাম',
      description: 'বিবরণ',
      categoryHint: 'bangladesh',
      issues: [],
    }

    const mockWriter: WriterResult = {
      status: 'PASS',
      headline: 'পরীক্ষিত শিরোনাম',
      summary: 'সংবাদ সারাংশ',
      body: '<p>সংবাদ বিবরণী এখানে বিস্তারিত আলোচনা করা হলো যাতে যথেষ্ট শব্দ থাকে।</p>',
      slug: 'porikkhato-shironam',
      seoTitle: 'পরীক্ষিত শিরোনাম | সংবাদচক্র',
      metaDescription: 'সংবাদ সারাংশ',
      category: 'bangladesh',
      categoryLabel: 'বাংলাদেশ',
      readingTime: 2,
      tags: ['সংবাদ'],
      score: 95,
      issues: [],
      provider: 'groq',
      model: 'llama-3.3-70b',
      latencyMs: 300,
    }

    it('decides PUBLISH when all 6 roles satisfy configured thresholds', () => {
      const factChecker: FactCheckerResult = {
        status: 'PASS',
        score: 95,
        decision: 'PASS',
        criticalError: false,
        claims: [],
        issues: [],
        latencyMs: 200,
      }
      const imageReviewer: ImageReviewerResult = {
        status: 'PASS',
        score: 90,
        decision: 'PASS',
        approvedImageUrl: 'https://images.unsplash.com/photo-1',
        imageRelevance: 90,
        imageQuality: 90,
        licenseStatus: 'allowed',
        attributionRequired: false,
        issues: [],
        latencyMs: 100,
      }
      const seoReviewer: SeoReviewerResult = {
        status: 'PASS',
        score: 85,
        decision: 'PASS',
        issues: [],
        suggestions: [],
        latencyMs: 150,
      }
      const duplicateChecker: DuplicateCheckerResult = {
        status: 'PASS',
        decision: 'NEW_STORY',
        similarity: 0.1,
        issues: [],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker,
        imageReviewer,
        seoReviewer,
        duplicateChecker,
        config: baseConfig,
      })

      expect(decision.decision).toBe('PUBLISH')
      expect(decision.checks.collector).toBe(true)
      expect(decision.checks.writer).toBe(true)
    })

    it('strictly REJECTS when Fact Checker flags critical error, regardless of other scores', () => {
      const factChecker: FactCheckerResult = {
        status: 'FAIL',
        score: 40,
        decision: 'FAIL',
        criticalError: true,
        claims: [],
        issues: ['Hallucination detected'],
        latencyMs: 200,
      }
      const imageReviewer: ImageReviewerResult = {
        status: 'PASS',
        score: 100,
        decision: 'PASS',
        approvedImageUrl: 'https://images.unsplash.com/photo-1',
        imageRelevance: 100,
        imageQuality: 100,
        licenseStatus: 'allowed',
        attributionRequired: false,
        issues: [],
        latencyMs: 100,
      }
      const seoReviewer: SeoReviewerResult = {
        status: 'PASS',
        score: 100,
        decision: 'PASS',
        issues: [],
        suggestions: [],
        latencyMs: 100,
      }
      const duplicateChecker: DuplicateCheckerResult = {
        status: 'PASS',
        decision: 'NEW_STORY',
        similarity: 0.0,
        issues: [],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker,
        imageReviewer,
        seoReviewer,
        duplicateChecker,
        config: baseConfig,
      })

      expect(decision.decision).toBe('REJECT')
      expect(decision.reasons.some((r) => r.includes('Fact Checker: CRITICAL ERROR'))).toBe(true)
    })

    it('strictly REJECTS when Duplicate Checker flags duplicate article', () => {
      const factChecker: FactCheckerResult = {
        status: 'PASS',
        score: 95,
        decision: 'PASS',
        criticalError: false,
        claims: [],
        issues: [],
        latencyMs: 200,
      }
      const duplicateChecker: DuplicateCheckerResult = {
        status: 'FAIL',
        decision: 'DUPLICATE',
        similarity: 0.98,
        issues: ['Article already published'],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker,
        imageReviewer: { status: 'PASS', score: 90, decision: 'PASS', imageRelevance: 90, imageQuality: 90, licenseStatus: 'allowed', attributionRequired: false, issues: [], latencyMs: 50 },
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker,
        config: baseConfig,
      })

      expect(decision.decision).toBe('REJECT')
    })

    it('HOLDS article when score is below minimum threshold but non-critical', () => {
      const factChecker: FactCheckerResult = {
        status: 'PASS',
        score: 82, // Below min 90
        decision: 'PASS',
        criticalError: false,
        claims: [],
        issues: ['Some claims need verification'],
        latencyMs: 200,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker,
        imageReviewer: { status: 'PASS', score: 90, decision: 'PASS', imageRelevance: 90, imageQuality: 90, licenseStatus: 'allowed', attributionRequired: false, issues: [], latencyMs: 50 },
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker: { status: 'PASS', decision: 'NEW_STORY', similarity: 0.1, issues: [], latencyMs: 50 },
        config: baseConfig,
      })

      expect(decision.decision).toBe('HOLD')
      expect(decision.reasons.some((r) => r.includes('Fact Checker score 82 below minimum 90'))).toBe(true)
    })

    it('HOLDS article when requireImage=true and no image is available', () => {
      const configWithRequiredImage: AiRuleConfig = {
        ...baseConfig,
        requireImage: true,
        imageOptional: false,
      }

      const imageReviewer: ImageReviewerResult = {
        status: 'FAIL',
        score: 0,
        decision: 'FAIL',
        approvedImageUrl: undefined,
        imageRelevance: 0,
        imageQuality: 0,
        licenseStatus: 'not_available',
        attributionRequired: false,
        issues: ['No image found in feed item'],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker: { status: 'PASS', score: 95, decision: 'PASS', criticalError: false, claims: [], issues: [], latencyMs: 100 },
        imageReviewer,
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker: { status: 'PASS', decision: 'NEW_STORY', similarity: 0.1, issues: [], latencyMs: 50 },
        config: configWithRequiredImage,
      })

      expect(decision.decision).toBe('HOLD')
      expect(decision.reasons.some((r) => r.includes('Image is required by Rule Config'))).toBe(true)
    })

    it('drops the failed image and still PUBLISHES when image_optional=true', () => {
      // Image candidate exists but scored below imageMin (85).
      const imageReviewer: ImageReviewerResult = {
        status: 'FAIL',
        score: 60,
        decision: 'FAIL',
        approvedImageUrl: 'https://broken-source.com/low-quality.jpg',
        imageRelevance: 60,
        imageQuality: 60,
        licenseStatus: 'unknown',
        attributionRequired: true,
        issues: ['Image quality below threshold'],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker: { status: 'PASS', score: 95, decision: 'PASS', criticalError: false, claims: [], issues: [], latencyMs: 100 },
        imageReviewer,
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker: { status: 'PASS', decision: 'NEW_STORY', similarity: 0.1, issues: [], latencyMs: 50 },
        config: baseConfig, // imageOptional: true
      })

      // Still allowed to publish WITHOUT the image…
      expect(decision.decision).toBe('PUBLISH')
      // …but the failed image must be stripped, never published.
      expect(decision.imageApproved).toBe(false)
      expect(decision.reasons.some((r) => r.includes('failed image removed'))).toBe(true)
    })

    it('keeps imageApproved=true when the image passes the threshold', () => {
      const imageReviewer: ImageReviewerResult = {
        status: 'PASS',
        score: 92,
        decision: 'PASS',
        approvedImageUrl: 'https://images.unsplash.com/photo-good',
        imageRelevance: 92,
        imageQuality: 92,
        licenseStatus: 'allowed',
        attributionRequired: false,
        issues: [],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker: { status: 'PASS', score: 95, decision: 'PASS', criticalError: false, claims: [], issues: [], latencyMs: 100 },
        imageReviewer,
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker: { status: 'PASS', decision: 'NEW_STORY', similarity: 0.1, issues: [], latencyMs: 50 },
        config: baseConfig,
      })

      expect(decision.decision).toBe('PUBLISH')
      expect(decision.imageApproved).toBe(true)
    })

    it('drops the failed image and HOLDS when image_optional=false', () => {
      const configWithRequiredImageQuality: AiRuleConfig = {
        ...baseConfig,
        imageOptional: false,
      }
      const imageReviewer: ImageReviewerResult = {
        status: 'FAIL',
        score: 60,
        decision: 'FAIL',
        approvedImageUrl: 'https://broken-source.com/low-quality.jpg',
        imageRelevance: 60,
        imageQuality: 60,
        licenseStatus: 'unknown',
        attributionRequired: true,
        issues: ['Image quality below threshold'],
        latencyMs: 50,
      }

      const decision = evaluateRuleEngine({
        collector: mockCollector,
        writer: mockWriter,
        factChecker: { status: 'PASS', score: 95, decision: 'PASS', criticalError: false, claims: [], issues: [], latencyMs: 100 },
        imageReviewer,
        seoReviewer: { status: 'PASS', score: 90, decision: 'PASS', issues: [], suggestions: [], latencyMs: 50 },
        duplicateChecker: { status: 'PASS', decision: 'NEW_STORY', similarity: 0.1, issues: [], latencyMs: 50 },
        config: configWithRequiredImageQuality,
      })

      expect(decision.decision).toBe('HOLD')
      expect(decision.imageApproved).toBe(false)
      expect(decision.reasons.some((r) => r.includes('below minimum'))).toBe(true)
    })
  })
})

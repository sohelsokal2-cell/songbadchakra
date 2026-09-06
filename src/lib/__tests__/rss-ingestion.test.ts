import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import {
  sanitizeHtml,
  stripHtmlToText,
  parseFeedXml,
  generateSlug,
  processItemWithAi,
  ingestSource,
  getMaxItemsToProcess,
} from '@/lib/rss-ingestion'
import { getAllArticles, getAllAiLogs } from '@/lib/news-repository'
import type { NewsSource } from '@/types/news'

describe('RSS Ingestion & Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('strips script and iframe tags completely', () => {
      const dirty = '<div>News <script>alert("xss")</script><iframe src="malicious.site"></iframe>text</div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).not.toContain('alert')
      expect(clean).not.toContain('<iframe')
      expect(clean).toContain('News')
      expect(clean).toContain('text')
    })

    it('removes inline event handlers like onclick and onerror', () => {
      const dirty = '<a href="https://example.com" onclick="stealCookies()" onmouseover="log()">Click me</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onclick')
      expect(clean).not.toContain('onmouseover')
      expect(clean).toContain('href="https://example.com"')
    })

    it('neutralizes javascript: URIs in href', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('javascript:')
      expect(clean).toContain('href="#"')
    })

    it('removes style, object, and embed tags', () => {
      const dirty = '<p>Story</p><style>body{display:none}</style><object data="bad.swf"></object>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<style')
      expect(clean).not.toContain('<object')
      expect(clean).toContain('<p>Story</p>')
    })

    it('decodes HTML entities safely', () => {
      const input = 'News &amp; Updates &lt;2026&gt;'
      const clean = sanitizeHtml(input)
      expect(clean).toBe('News & Updates <2026>')
    })
  })

  describe('stripHtmlToText', () => {
    it('strips all markup and returns plain text', () => {
      const html = '<p>প্রথম <strong>আলো</strong> রিপোর্ট: <a href="#">বিস্তারিত</a></p>'
      const text = stripHtmlToText(html)
      expect(text).toBe('প্রথম আলো রিপোর্ট: বিস্তারিত')
    })
  })

  describe('getMaxItemsToProcess (respects Rule Engine maxItemsPerRun)', () => {
    it('uses the configured limit when it is lower than fetched items', () => {
      expect(getMaxItemsToProcess(3, 12)).toBe(3)
    })

    it('never exceeds the safe upper bound of 20', () => {
      expect(getMaxItemsToProcess(500, 500)).toBe(20)
    })

    it('falls back to 10 when the config is missing or invalid', () => {
      expect(getMaxItemsToProcess(undefined, 30)).toBe(10)
      expect(getMaxItemsToProcess(0, 30)).toBe(10)
      expect(getMaxItemsToProcess(Number.NaN, 30)).toBe(10)
    })

    it('clamps to the item count when fewer items are available', () => {
      expect(getMaxItemsToProcess(10, 2)).toBe(2)
    })
  })

  describe('parseFeedXml', () => {
    it('parses standard RSS 2.0 XML with items', () => {
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <title>টেস্ট বাংলা সংবাদ</title>
          <item>
            <title><![CDATA[ঢাকায় নতুন মেট্রো রেল স্টেশন চালু]]></title>
            <link>https://testnews.com/metro-station</link>
            <description><![CDATA[মিরপুরে আজ নতুন একটি মেট্রো স্টেশন উদ্বোধন করা হয়েছে।]]></description>
            <pubDate>Sun, 06 Sep 2026 04:00:00 GMT</pubDate>
            <media:content url="https://testnews.com/images/metro.jpg" />
          </item>
        </channel>
      </rss>`

      const items = parseFeedXml(rss)
      expect(items.length).toBe(1)
      expect(items[0].title).toBe('ঢাকায় নতুন মেট্রো রেল স্টেশন চালু')
      expect(items[0].link).toBe('https://testnews.com/metro-station')
      expect(items[0].description).toContain('মিরপুরে আজ নতুন একটি')
      expect(items[0].imageUrl).toBe('https://testnews.com/images/metro.jpg')
    })

    it('parses Atom feed entries', () => {
      const atom = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom Feed Example</title>
        <entry>
          <title>জাতীয় দলের নতুন কোচ নিয়োগ</title>
          <link href="https://testnews.com/cricket-coach" />
          <summary>বাংলাদেশ ক্রিকেট বোর্ডের আনুষ্ঠানিক ঘোষণা।</summary>
          <updated>2026-09-06T03:30:00Z</updated>
        </entry>
      </feed>`

      const items = parseFeedXml(atom)
      expect(items.length).toBe(1)
      expect(items[0].title).toBe('জাতীয় দলের নতুন কোচ নিয়োগ')
      expect(items[0].link).toBe('https://testnews.com/cricket-coach')
      expect(items[0].description).toBe('বাংলাদেশ ক্রিকেট বোর্ডের আনুষ্ঠানিক ঘোষণা।')
    })
  })

  describe('generateSlug', () => {
    it('generates a URL friendly Bengali slug with unique suffix', () => {
      const slug = generateSlug('প্রধানমন্ত্রী শেখ হাসিনার গুরুত্বপূর্ণ বার্তা')
      expect(slug).toBeTruthy()
      expect(slug).toContain('প্রধানমন্ত্রী')
      expect(slug).toMatch(/-[a-z0-9]{5}$/)
    })
  })

  describe('processItemWithAi (offline fallback)', () => {
    const dummySource: NewsSource = {
      id: 'src-test',
      name: 'টেস্ট সংবাদ',
      url: 'https://test.com',
      feedUrl: 'https://test.com/rss',
      category: 'bangladesh',
      categoryLabel: 'বাংলাদেশ',
      isActive: true,
      fetchIntervalMinutes: 60,
      createdAt: new Date().toISOString(),
    }

    it('returns formatted Bengali article draft with tags and reading time', async () => {
      const item = {
        title: 'অর্থনীতিতে নতুন বিনিয়োগ প্রবাহ',
        link: 'https://test.com/economy-news',
        description: 'দেশের রপ্তানি খাতে ইতিবাচক ধারা বজায় রয়েছে এবং নতুন কর্মসংস্থান সৃষ্টি হচ্ছে।',
      }

      const result = await processItemWithAi(item, dummySource)
      expect(result.title).toBe('অর্থনীতিতে নতুন বিনিয়োগ প্রবাহ')
      expect(result.summary).toContain('দেশের রপ্তানি খাতে')
      expect(result.tags).toContain('বাংলাদেশ')
      expect(result.readingTime).toBeGreaterThanOrEqual(1)
      expect(result.provider).toBe('local-editorial-engine')
    })
  })

  describe('ingestSource pipeline and deduplication', () => {
    const RSS_TEST_DATA_PATH = path.resolve('.data/portal-data-rss-test.json')

    beforeEach(async () => {
      process.env.PORTAL_DATA_PATH = RSS_TEST_DATA_PATH
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      await fs.mkdir(path.resolve('.data'), { recursive: true })
      await fs.writeFile(
        RSS_TEST_DATA_PATH,
        JSON.stringify({ articles: [], contactMessages: [], sources: [], aiLogs: [] }),
        'utf-8'
      )
    })

    afterEach(async () => {
      vi.restoreAllMocks()
      try {
        await fs.unlink(RSS_TEST_DATA_PATH)
      } catch {
        // ignore
      }
    })

    it('fetches feed, inserts draft articles, and logs AI operations', async () => {
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Mock Source</title>
          <item>
            <title>কৃত্রিম বুদ্ধিমত্তা চালিত নতুন প্রযুক্তি উদ্ভাবন</title>
            <link>https://mocknews.com/ai-invention-1</link>
            <description>তথ্যপ্রযুক্তি খাতে যুগান্তকারী অগ্রগতি সাধিত হয়েছে।</description>
            <pubDate>Sun, 06 Sep 2026 05:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      } as unknown as Response)

      const source: NewsSource = {
        id: 'src-mock',
        name: 'মক সংবাদ',
        url: 'https://mocknews.com',
        feedUrl: 'https://mocknews.com/rss.xml',
        category: 'technology',
        categoryLabel: 'প্রযুক্তি',
        isActive: true,
        fetchIntervalMinutes: 60,
        createdAt: new Date().toISOString(),
      }

      const res = await ingestSource(source)
      expect(res.fetchedCount).toBe(1)
      expect(res.ingestedCount).toBe(1)
      expect(res.skippedCount).toBe(0)

      // Verify article created as draft
      const articles = await getAllArticles()
      const created = articles.articles.find((a) => a.sourceUrl === 'https://mocknews.com/ai-invention-1')
      expect(created).toBeDefined()
      expect(created?.status).toBe('draft') // Strictly draft
      expect(created?.sourceName).toBe('মক সংবাদ')

      // Verify AI log created
      const logs = await getAllAiLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].sourceUrl).toBe('https://mocknews.com/ai-invention-1')
      expect(logs[0].status).toBe('completed')

      // Test Deduplication: second run with same URL
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      } as unknown as Response)

      const res2 = await ingestSource(source)
      expect(res2.fetchedCount).toBe(1)
      expect(res2.ingestedCount).toBe(0)
      expect(res2.skippedCount).toBe(1) // Successfully deduplicated!
    })
  })
})

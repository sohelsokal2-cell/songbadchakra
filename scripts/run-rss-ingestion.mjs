/**
 * SongbadChakra — RSS Feed Ingestion & AI Automation Runner
 * 
 * Can be run manually or as a cron job:
 *   node scripts/run-rss-ingestion.mjs
 * 
 * Works with Supabase (if configured) or local data store fallback.
 * Strictly creates articles in 'draft' status for editorial approval.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

// Try loading .env.local
try {
  const envContent = await fs.readFile(path.join(ROOT_DIR, '.env.local'), 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
} catch {
  // No .env.local, use process.env
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATA_FILE = path.join(ROOT_DIR, '.data', 'portal-data.json')

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}

async function supabaseRequest(resource, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${resource}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!response.ok) throw new Error(`Supabase error (${response.status}): ${await response.text()}`)
  if (response.status === 204) return undefined
  const text = await response.text()
  return text ? JSON.parse(text) : undefined
}

function sanitizeHtml(rawHtml) {
  if (!rawHtml) return ''
  return rawHtml
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function stripHtmlToText(html) {
  return sanitizeHtml(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractXmlTag(xml, tag) {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  if (!match) return ''
  return match[1].replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1').trim()
}

function parseFeedXml(xmlString) {
  const items = []
  const cleanXml = xmlString.trim()
  const isAtom = /<feed\b[^>]*>/i.test(cleanXml)

  if (isAtom) {
    const entryMatches = cleanXml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)
    for (const match of entryMatches) {
      const entryXml = match[1]
      const title = extractXmlTag(entryXml, 'title')
      const linkMatch = entryXml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)
      const link = linkMatch ? linkMatch[1] : extractXmlTag(entryXml, 'link')
      const summary = extractXmlTag(entryXml, 'summary') || extractXmlTag(entryXml, 'content')
      const updated = extractXmlTag(entryXml, 'updated') || extractXmlTag(entryXml, 'published')

      if (title && link) {
        items.push({
          title: stripHtmlToText(title),
          link: link.trim(),
          description: stripHtmlToText(summary),
          content: sanitizeHtml(summary),
          pubDate: updated || new Date().toISOString(),
        })
      }
    }
  } else {
    const itemMatches = cleanXml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)
    for (const match of itemMatches) {
      const itemXml = match[1]
      const title = extractXmlTag(itemXml, 'title')
      const link = extractXmlTag(itemXml, 'link')
      const description = extractXmlTag(itemXml, 'description')
      const content = extractXmlTag(itemXml, 'content:encoded') || description
      const pubDate = extractXmlTag(itemXml, 'pubDate')

      if (title && link) {
        items.push({
          title: stripHtmlToText(title),
          link: link.trim(),
          description: stripHtmlToText(description),
          content: sanitizeHtml(content),
          pubDate: pubDate || new Date().toISOString(),
        })
      }
    }
  }

  return items
}

function generateSlug(title) {
  const sanitized = title
    .toLowerCase()
    .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 70)
  const randomSuffix = Math.random().toString(36).slice(2, 7)
  return sanitized ? `${sanitized}-${randomSuffix}` : `news-${Date.now()}-${randomSuffix}`
}

async function loadLocalStore() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'))
  } catch {
    return { articles: [], sources: [], aiLogs: [] }
  }
}

async function saveLocalStore(store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

async function main() {
  console.log('🚀 সংবাদচক্র RSS ও AI নিউজ পাইপলাইন শুরু হচ্ছে...\n')

  let sources = []
  let existingUrls = new Set()

  if (isSupabaseConfigured()) {
    console.log('📡 সুপাবেজ ক্লাউড সংযুক্ত:', SUPABASE_URL)
    const dbSources = await supabaseRequest('sources?select=*&is_active=eq.true')
    sources = dbSources || []

    const articles = await supabaseRequest('articles?select=source_url&limit=2000')
    if (articles) {
      articles.forEach((a) => {
        if (a.source_url && a.source_url !== '#') existingUrls.add(a.source_url)
      })
    }
  } else {
    console.log('📁 লোকাল ডেটা স্টোর ব্যবহার করা হচ্ছে:', DATA_FILE)
    const store = await loadLocalStore()
    sources = (store.sources || []).filter((s) => s.isActive)
    ;(store.articles || []).forEach((a) => {
      if (a.sourceUrl && a.sourceUrl !== '#') existingUrls.add(a.sourceUrl)
    })
  }

  console.log(`📋 সক্রিয় সোর্স সংখ্যা: ${sources.length} টি`)

  let totalNewArticles = 0
  let totalSkipped = 0

  for (const source of sources) {
    const feedUrl = source.feedUrl || source.feed_url
    const sourceName = source.name
    const sourceCategory = source.category || 'bangladesh'
    const categoryLabel = source.categoryLabel || source.category_label || 'বাংলাদেশ'

    console.log(`\n🔍 ফিড চেক করা হচ্ছে: ${sourceName} (${feedUrl})`)

    try {
      const res = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'SongbadChakra-Bot/1.0 (+https://songbadchakra.com.bd)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      })

      if (!res.ok) {
        console.error(`  ❌ ফিড রিকোয়েস্ট ব্যর্থ: HTTP ${res.status}`)
        continue
      }

      const xml = await res.text()
      const items = parseFeedXml(xml)
      console.log(`  📄 প্রাপ্ত আইটেম সংখ্যা: ${items.length} টি`)

      for (const item of items.slice(0, 5)) {
        if (existingUrls.has(item.link)) {
          totalSkipped++
          continue
        }

        const cleanSummary = item.description.length > 220 
          ? item.description.slice(0, 217) + '...' 
          : item.description

        const article = {
          id: `art-${crypto.randomUUID()}`,
          title: item.title,
          slug: generateSlug(item.title),
          summary: cleanSummary || item.title,
          content: item.content || `<p>${item.description}</p>`,
          category: sourceCategory,
          category_label: categoryLabel,
          categoryLabel: categoryLabel,
          source_name: sourceName,
          sourceName: sourceName,
          source_url: item.link,
          sourceUrl: item.link,
          image_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
          imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
          published_at: item.pubDate || new Date().toISOString(),
          publishedAt: item.pubDate || new Date().toISOString(),
          is_breaking: false,
          isBreaking: false,
          status: 'draft', // Strictly draft for review
          author: {
            name: `${sourceName} (স্বয়ংক্রিয় সংকলন)`,
            title: 'সংবাদচক্র অটোমেশন ডেস্ক',
          },
          reading_time: 2,
          readingTime: 2,
          tags: [categoryLabel, sourceName],
        }

        if (isSupabaseConfigured()) {
          await supabaseRequest('articles', {
            method: 'POST',
            body: JSON.stringify({
              id: article.id,
              title: article.title,
              slug: article.slug,
              summary: article.summary,
              content: article.content,
              category: article.category,
              category_label: article.categoryLabel,
              source_name: article.sourceName,
              source_url: article.sourceUrl,
              image_url: article.imageUrl,
              published_at: article.publishedAt,
              is_breaking: false,
              status: 'draft',
              author: article.author,
              reading_time: article.readingTime,
              tags: article.tags,
            }),
          })

          await supabaseRequest('ai_logs', {
            method: 'POST',
            body: JSON.stringify({
              id: crypto.randomUUID(),
              source_id: source.id,
              source_url: item.link,
              provider: 'rss-pipeline',
              model: 'auto-ingest-v1',
              status: 'completed',
              raw_title: item.title,
              raw_summary: cleanSummary,
              processed_article_id: article.id,
            }),
          })
        } else {
          const store = await loadLocalStore()
          store.articles = store.articles || []
          store.aiLogs = store.aiLogs || []
          store.articles.unshift(article)
          store.aiLogs.unshift({
            id: crypto.randomUUID(),
            sourceId: source.id,
            sourceUrl: item.link,
            provider: 'rss-pipeline',
            model: 'auto-ingest-v1',
            status: 'completed',
            rawTitle: item.title,
            rawSummary: cleanSummary,
            processedArticleId: article.id,
            createdAt: new Date().toISOString(),
          })
          await saveLocalStore(store)
        }

        existingUrls.add(item.link)
        totalNewArticles++
        console.log(`  ✅ নতুন ড্রাফট তৈরি হয়েছে: "${item.title.slice(0, 45)}..."`)
      }
    } catch (err) {
      console.error(`  ❌ ত্রুটি: ${err.message}`)
    }
  }

  console.log('\n=========================================')
  console.log(`🎉 সমাপ্ত: ${totalNewArticles} টি নতুন ড্রাফট সংকলিত`)
  console.log(`⏭️ স্কিপ করা হয়েছে (পূর্বে বিদ্যমান): ${totalSkipped} টি`)
  console.log('💡 নতুন সংবাদগুলো দেখার জন্য Admin Panel-এর "AI ড্রাফট" মেনুতে যান।')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

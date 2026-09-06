/**
 * Script to seed mock articles into Supabase via REST API.
 * Usage:
 *   node scripts/seed-supabase.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in process.env or .env.local
 */

import fs from 'fs'
import path from 'path'

// Load .env.local if present
const envLocalPath = path.resolve('.env.local')
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex > 0) {
      const key = trimmed.slice(0, equalsIndex).trim()
      const val = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local or environment.')
  process.exit(1)
}

const dataFilePath = path.resolve('.data/portal-data.json')
if (!fs.existsSync(dataFilePath)) {
  console.error(`Error: Data file not found at ${dataFilePath}`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'))
const articles = data.articles || []

console.log(`Starting seed of ${articles.length} articles to Supabase (${supabaseUrl})...`)

function serializeArticle(article) {
  return {
    id: String(article.id),
    title: String(article.title),
    slug: String(article.slug),
    summary: String(article.summary || ''),
    content: String(article.content),
    category: String(article.category),
    category_label: String(article.categoryLabel),
    source_name: String(article.sourceName || 'সংবাদচক্র বার্তা'),
    source_url: String(article.sourceUrl || '#'),
    image_url: String(article.imageUrl),
    published_at: article.publishedAt || new Date().toISOString(),
    is_breaking: Boolean(article.isBreaking),
    status: article.status === 'draft' ? 'draft' : 'published',
    author: article.author || null,
    division: article.division || null,
    district: article.district || null,
    is_video: Boolean(article.isVideo),
    video_duration: article.videoDuration || null,
    is_opinion: Boolean(article.isOpinion),
    is_photo_feature: Boolean(article.isPhotoFeature),
    reading_time: typeof article.readingTime === 'number' ? article.readingTime : null,
    tags: Array.isArray(article.tags) ? article.tags : null,
  }
}

let insertedCount = 0
let skippedCount = 0
let errorCount = 0

for (const article of articles) {
  const serialized = serializeArticle(article)
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/articles`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify([serialized]),
    })

    if (res.ok) {
      const responseData = await res.json()
      if (Array.isArray(responseData) && responseData.length > 0) {
        insertedCount++
        console.log(`✓ Inserted: ${article.slug}`)
      } else {
        skippedCount++
        console.log(`- Skipped (already exists): ${article.slug}`)
      }
    } else {
      const errText = await res.text()
      errorCount++
      console.error(`✗ Error on ${article.slug} (${res.status}): ${errText}`)
    }
  } catch (err) {
    errorCount++
    console.error(`✗ Request failed for ${article.slug}:`, err.message)
  }
}

console.log('\n--- Seed Complete ---')
console.log(`Total: ${articles.length}`)
console.log(`Inserted: ${insertedCount}`)
console.log(`Skipped (Duplicates): ${skippedCount}`)
console.log(`Errors: ${errorCount}`)

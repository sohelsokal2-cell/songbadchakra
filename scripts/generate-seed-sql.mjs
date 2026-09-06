import fs from 'fs'
import path from 'path'

// Read mockNews.ts and strip the TypeScript type import
const mockNewsPath = path.resolve('src/data/mockNews.ts')
let content = fs.readFileSync(mockNewsPath, 'utf-8')

// Replace import
content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]@\/types\/news['"]/, '')

// Remove ': NewsArticle[]' type annotation
content = content.replace('export const mockNews: NewsArticle[] =', 'export const mockNews =')

// Create a temp file to import
const tempFile = path.resolve('scripts/_temp_mock.ts')
fs.writeFileSync(tempFile, content, 'utf-8')

try {
  const { mockNews } = await import(`file://${tempFile}`)
  console.log(`Loaded ${mockNews.length} mock articles.`)

  function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL'
    return `'${String(str).replace(/'/g, "''")}'`
  }

  function escapeArray(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 'NULL'
    const escapedItems = arr.map((item) => `"${String(item).replace(/"/g, '\\"')}"`).join(',')
    return `'{${escapedItems}}'`
  }

  function escapeJson(obj) {
    if (!obj || typeof obj !== 'object') return 'NULL'
    return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
  }

  const values = mockNews.map((article) => {
    const id = escapeSql(article.id)
    const title = escapeSql(article.title)
    const slug = escapeSql(article.slug)
    const summary = escapeSql(article.summary || '')
    const contentText = escapeSql(article.content)
    const category = escapeSql(article.category)
    const categoryLabel = escapeSql(article.categoryLabel)
    const sourceName = escapeSql(article.sourceName || 'সংবাদচক্র বার্তা')
    const sourceUrl = escapeSql(article.sourceUrl || '#')
    const imageUrl = escapeSql(article.imageUrl)
    const publishedAt = escapeSql(article.publishedAt || new Date().toISOString())
    const isBreaking = article.isBreaking ? 'true' : 'false'
    const status = escapeSql(article.status || 'published')
    const author = escapeJson(article.author)
    const division = escapeSql(article.division || null)
    const district = escapeSql(article.district || null)
    const isVideo = article.isVideo ? 'true' : 'false'
    const videoDuration = escapeSql(article.videoDuration || null)
    const isOpinion = article.isOpinion ? 'true' : 'false'
    const isPhotoFeature = article.isPhotoFeature ? 'true' : 'false'
    const readingTime = article.readingTime !== undefined ? article.readingTime : 'NULL'
    const tags = escapeArray(article.tags)

    return `  (${id}, ${title}, ${slug}, ${summary}, ${contentText}, ${category}, ${categoryLabel}, ${sourceName}, ${sourceUrl}, ${imageUrl}, ${publishedAt}, ${isBreaking}, ${status}, ${author}, ${division}, ${district}, ${isVideo}, ${videoDuration}, ${isOpinion}, ${isPhotoFeature}, ${readingTime}, ${tags})`
  })

  const sql = `-- ==============================================================================
-- Migration: Seed initial mock articles into canonical 'articles' table
-- Created at: 2026-09-06
-- Idempotent: Skips articles whose slugs already exist
-- ==============================================================================

INSERT INTO public.articles (
  id,
  title,
  slug,
  summary,
  content,
  category,
  category_label,
  source_name,
  source_url,
  image_url,
  published_at,
  is_breaking,
  status,
  author,
  division,
  district,
  is_video,
  video_duration,
  is_opinion,
  is_photo_feature,
  reading_time,
  tags
) VALUES
${values.join(',\n')}
ON CONFLICT (slug) DO NOTHING;
`

  const outputPath = path.resolve('supabase/migrations/20260906_seed_articles.sql')
  fs.writeFileSync(outputPath, sql, 'utf-8')
  console.log(`Successfully generated ${outputPath}`)
} finally {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }
}

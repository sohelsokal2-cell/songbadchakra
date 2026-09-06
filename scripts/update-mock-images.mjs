import fs from 'fs'
import path from 'path'

const file = path.resolve('src/data/mockNews.ts')
let content = fs.readFileSync(file, 'utf8')

const imageMap = {
  'budget': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
  'climate': 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&auto=format&fit=crop&q=80',
  'cricket': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'metro': 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&auto=format&fit=crop&q=80',
  'padma': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80',
  'port': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
  'un': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
  'peace': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
  'election': 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80',
  'parliament': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
  'football': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
  'bpl': 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=800&auto=format&fit=crop&q=80',
  '6g': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'startup': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
  'ecommerce': 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=800&auto=format&fit=crop&q=80',
  'music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
  'galaxy': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  'iftar': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  'cycling': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
  'mental': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
  'flood': 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80',
  'china': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&auto=format&fit=crop&q=80',
  'education': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
  'mars': 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
  'ott': 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
  'ipl': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'
}

let count = 0
for (const [seed, url] of Object.entries(imageMap)) {
  const target = `https://picsum.photos/seed/${seed}/800/450`
  if (content.includes(target)) {
    content = content.replaceAll(target, url)
    count++
  }
}

// Replace any leftover picsum URLs with high-quality news Unsplash
content = content.replace(/https:\/\/picsum\.photos\/seed\/[a-zA-Z0-9_-]+\/800\/450/g, 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80')

fs.writeFileSync(file, content, 'utf8')
console.log(`Successfully updated ${count} sample news images in mockNews.ts`)

const sqlFile = path.resolve('supabase/migrations/20260906_seed_articles.sql')
if (fs.existsSync(sqlFile)) {
  let sqlContent = fs.readFileSync(sqlFile, 'utf8')
  let sqlCount = 0
  for (const [seed, url] of Object.entries(imageMap)) {
    const target = `https://picsum.photos/seed/${seed}/800/450`
    if (sqlContent.includes(target)) {
      sqlContent = sqlContent.replaceAll(target, url)
      sqlCount++
    }
  }
  sqlContent = sqlContent.replace(/https:\/\/picsum\.photos\/seed\/[a-zA-Z0-9_-]+\/800\/450/g, 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80')
  fs.writeFileSync(sqlFile, sqlContent, 'utf8')
  console.log(`Successfully updated ${sqlCount} images in 20260906_seed_articles.sql`)
}

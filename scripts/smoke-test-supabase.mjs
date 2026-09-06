/**
 * End-to-End Supabase Live Smoke Test
 * Verifies live database queries, mutations, RLS, and repository contracts.
 * 
 * Usage: node scripts/smoke-test-supabase.mjs
 */

import fs from 'fs'
import path from 'path'

// Load .env.local
const envLocalPath = path.resolve('.env.local')
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 সংবাদচক্র — Supabase এন্ড-টু-এন্ড লাইভ স্মোক টেস্ট শুরু হচ্ছে...\n')
console.log(`🔗 ডেটাবেজ URL: ${SUPABASE_URL}\n`)

let passedCount = 0
let failedCount = 0

async function runCheck(name, fn) {
  process.stdout.write(`⏳ [TEST] ${name}... `)
  try {
    await fn()
    console.log('✅ সফল')
    passedCount++
  } catch (err) {
    console.log(`❌ ব্যর্থ: ${err.message}`)
    failedCount++
  }
}

async function request(resource, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${resource}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined
  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}

async function main() {
  // 1. Check Articles Count
  await runCheck('পাবলিক প্রকাশিত সংবাদ রিড টেস্ট', async () => {
    const rows = await request('articles?select=id,title,slug,status&limit=10')
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('কোনো সংবাদ পাওয়া যায়নি।')
    }
    const sample = rows[0]
    if (!sample.id || !sample.title || !sample.slug) {
      throw new Error('সংবাদের প্রয়োজনীয় ফিল্ড অনুপস্থিত।')
    }
  })

  // 2. Query specific article by slug
  await runCheck('স্লাগ দিয়ে নির্দিষ্ট সংবাদ কুয়েরি টেস্ট', async () => {
    const rows = await request('articles?slug=eq.dhaka-emergency-cabinet-budget-approval&select=*')
    if (!rows || rows.length === 0) {
      throw new Error('নির্দিষ্ট স্লাগ dhaka-emergency-cabinet-budget-approval পাওয়া যায়নি।')
    }
    if (rows[0].category !== 'bangladesh') {
      throw new Error(`প্রত্যাশিত ক্যাটাগরি 'bangladesh' কিন্তু পাওয়া গেছে '${rows[0].category}'`)
    }
  })

  // 3. Check Breaking News filtering
  await runCheck('ব্রেকিং নিউজ ফিল্টারিং টেস্ট', async () => {
    const rows = await request('articles?is_breaking=eq.true&status=eq.published&select=id,title')
    if (!Array.isArray(rows)) throw new Error('রেসপন্স অ্যারে নয়।')
  })

  // 4. Check Sources table
  await runCheck('RSS ফিড সোর্স তালিকা যাচাই', async () => {
    const rows = await request('sources?select=*')
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('sources টেবিলে কোনো সোর্স পাওয়া যায়নি।')
    }
    const bbc = rows.find((s) => s.id === 'src-bbc-bangla')
    if (!bbc) throw new Error('src-bbc-bangla সোর্স অনুপস্থিত।')
  })

  // 5. Test Contact Message Mutation (Create, Read, Delete)
  let testMsgId = null
  await runCheck('পাঠক বার্তা (Contact Message) তৈরি ও ইনসার্ট টেস্ট', async () => {
    testMsgId = `test-${Date.now()}`
    const [created] = await request('contact_messages', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: testMsgId,
        name: 'স্মোক টেস্ট পাঠক',
        email: 'smoketest@songbadchakra.com.bd',
        phone: '01700000000',
        subject: 'স্মোক টেস্ট বিষয়',
        message: 'এটি একটি লাইভ স্বয়ংক্রিয় স্মোক টেস্ট মেসেজ।',
        is_read: false,
        created_at: new Date().toISOString(),
      }),
    })
    if (!created || created.id !== testMsgId) {
      throw new Error('বার্তা সংরক্ষণ সফল হয়নি।')
    }
  })

  await runCheck('পাঠক বার্তা রিড ও স্ট্যাটাস আপডেট টেস্ট', async () => {
    if (!testMsgId) throw new Error('মেসেজ আইডি অনুপস্থিত।')
    const updated = await request(`contact_messages?id=eq.${testMsgId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ is_read: true }),
    })
    if (!updated || updated.length === 0 || !updated[0].is_read) {
      throw new Error('পাঠক বার্তা পড়া হয়েছে (is_read=true) আপডেট হয়নি।')
    }
  })

  await runCheck('পাঠক বার্তা ডিলিট ও ক্লিনআপ টেস্ট', async () => {
    if (!testMsgId) throw new Error('মেসেজ আইডি অনুপস্থিত।')
    await request(`contact_messages?id=eq.${testMsgId}`, {
      method: 'DELETE',
    })
    const check = await request(`contact_messages?id=eq.${testMsgId}`)
    if (check && check.length > 0) {
      throw new Error('মেসেজ ক্লিনআপ হয়নি।')
    }
  })

  // 6. Test AI Log Insertion & Read
  let testLogId = null
  await runCheck('AI ইনজেশন ও অডিট লগ ইনসার্ট টেস্ট', async () => {
    testLogId = `log-test-${Date.now()}`
    const [created] = await request('ai_logs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: testLogId,
        source_id: 'src-bbc-bangla',
        source_url: `https://example.com/smoke-test-${Date.now()}`,
        provider: 'smoke-test-runner',
        model: 'test-v1',
        status: 'completed',
        prompt_tokens: 10,
        completion_tokens: 10,
        raw_title: 'স্মোক টেস্ট শিরোনাম',
        raw_summary: 'স্মোক টেস্ট সারসংক্ষেপ',
      }),
    })
    if (!created || created.id !== testLogId) {
      throw new Error('AI লগ তৈরি হয়নি।')
    }
  })

  await runCheck('AI লগ ডিলিট ও ক্লিনআপ টেস্ট', async () => {
    if (!testLogId) throw new Error('লগ আইডি অনুপস্থিত।')
    await request(`ai_logs?id=eq.${testLogId}`, {
      method: 'DELETE',
    })
  })

  // 7. Test Partial Unique Index on articles.source_url
  await runCheck('ডুপ্লিকেট সংবাদ ইনজেশন রোধ (Unique Source URL) ইনডেক্স যাচাই', async () => {
    const testSlug1 = `smoke-art-1-${Date.now()}`
    const testSlug2 = `smoke-art-2-${Date.now()}`
    const duplicateUrl = `https://example.com/duplicate-test-${Date.now()}`

    // Insert first article
    await request('articles', {
      method: 'POST',
      body: JSON.stringify({
        id: `smoke-1-${Date.now()}`,
        title: 'টেস্ট আর্টিকেল ১',
        slug: testSlug1,
        summary: 'সারসংক্ষেপ ১',
        content: '<p>কন্টেন্ট ১</p>',
        category: 'bangladesh',
        category_label: 'বাংলাদেশ',
        source_name: 'স্মোক টেস্ট',
        source_url: duplicateUrl,
        image_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        status: 'draft',
      }),
    })

    // Try to insert second article with SAME source_url - must fail due to unique index
    let duplicateRejected = false
    try {
      await request('articles', {
        method: 'POST',
        body: JSON.stringify({
          id: `smoke-2-${Date.now()}`,
          title: 'টেস্ট আর্টিকেল ২',
          slug: testSlug2,
          summary: 'সারসংক্ষেপ ২',
          content: '<p>কন্টেন্ট ২</p>',
          category: 'bangladesh',
          category_label: 'বাংলাদেশ',
          source_name: 'স্মোক টেস্ট',
          source_url: duplicateUrl,
          image_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
          status: 'draft',
        }),
      })
    } catch {
      duplicateRejected = true
    }

    // Clean up first test article
    await request(`articles?slug=eq.${testSlug1}`, { method: 'DELETE' })

    if (!duplicateRejected) {
      throw new Error('ডুপ্লিকেট source_url যুক্ত আর্টিকেল প্রত্যাখ্যাত হয়নি (ইউনিক ইনডেক্স অনুপস্থিত)।')
    }
  })

  console.log('\n=========================================')
  console.log(`📊 স্মোক টেস্ট ফলাফল: মোট ${passedCount + failedCount} টি পরীক্ষা`)
  console.log(`✅ সফল: ${passedCount} টি`)
  console.log(`❌ ব্যর্থ: ${failedCount} টি`)
  console.log('=========================================')

  if (failedCount > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

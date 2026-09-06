import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAllSources, getSourceById } from '@/lib/news-repository'
import { ingestSource, type IngestionResult } from '@/lib/rss-ingestion'

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    let sourceId: string | undefined
    try {
      const body = await request.json()
      sourceId = body?.sourceId
    } catch {
      // Empty body is allowed (triggers all active sources)
    }

    const results: IngestionResult[] = []

    if (sourceId) {
      const source = await getSourceById(sourceId)
      if (!source) {
        return NextResponse.json({ error: 'সোর্স পাওয়া যায়নি।' }, { status: 404 })
      }
      const res = await ingestSource(source)
      results.push(res)
    } else {
      const allSources = await getAllSources()
      const activeSources = allSources.filter((s) => s.isActive)

      for (const source of activeSources) {
        const res = await ingestSource(source)
        results.push(res)
      }
    }

    const totalFetched = results.reduce((acc, r) => acc + r.fetchedCount, 0)
    const totalIngested = results.reduce((acc, r) => acc + r.ingestedCount, 0)
    const totalSkipped = results.reduce((acc, r) => acc + r.skippedCount, 0)
    const totalFailed = results.reduce((acc, r) => acc + r.failedCount, 0)

    return NextResponse.json({
      success: true,
      summary: {
        totalFetched,
        totalIngested,
        totalSkipped,
        totalFailed,
      },
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ইনজেশন চালাতে সমস্যা হয়েছে।' },
      { status: 500 }
    )
  }
}

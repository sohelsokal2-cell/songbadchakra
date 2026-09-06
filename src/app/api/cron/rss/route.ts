import { NextResponse } from 'next/server'
import { getAllSources, getSourceById } from '@/lib/news-repository'
import { ingestSource, type IngestionResult } from '@/lib/rss-ingestion'

export const dynamic = 'force-dynamic'

/**
 * Validates request authentication for scheduled cron executions.
 * Accepts:
 *   - Bearer token in Authorization header matching CRON_SECRET or ADMIN_SESSION_SECRET
 *   - X-Cron-Secret header matching CRON_SECRET or ADMIN_SESSION_SECRET
 */
function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET
  if (!cronSecret) {
    // If neither secret is set in non-production, allow execution with warning
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token === cronSecret) return true
  }

  const xCronSecret = request.headers.get('x-cron-secret')
  if (xCronSecret && xCronSecret === cronSecret) {
    return true
  }

  return false
}

async function handleIngest(request: Request, sourceId?: string) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'অননুমোদিত অ্যাক্সেস। সঠিক CRON_SECRET প্রয়োজন।' },
      { status: 401 }
    )
  }

  try {
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

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          totalFetched,
          totalIngested,
          totalSkipped,
          totalFailed,
        },
        results,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ক্রন ইনজেশন চালাতে সমস্যা হয়েছে।' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('sourceId') || undefined
  return handleIngest(request, sourceId)
}

export async function POST(request: Request) {
  let sourceId: string | undefined
  try {
    const body = await request.json()
    sourceId = body?.sourceId
  } catch {
    // Empty body is allowed
  }
  return handleIngest(request, sourceId)
}

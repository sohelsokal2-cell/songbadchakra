import { NextResponse } from 'next/server'
import { getAllSources, getSourceById } from '@/lib/news-repository'
import { ingestSource, type IngestionResult } from '@/lib/rss-ingestion'
import { runAutomationCycle } from '@/lib/ai/job-recovery'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * Runs the self-healing automation cycle (stale-job recovery, retries,
 * dead-letter processing and queued-job execution) before fresh ingestion.
 * Recovery is best-effort — failures never abort the ingestion pass.
 */
async function runRecovery() {
  try {
    return await runAutomationCycle()
  } catch (err) {
    return {
      recoveredStale: 0,
      requeuedFailed: 0,
      deadLettered: 0,
      processedQueued: 0,
      succeeded: 0,
      failed: 0,
      deadLetterQueue: 0,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }
  }
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

    const recovery = await runRecovery()

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
        recovery,
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

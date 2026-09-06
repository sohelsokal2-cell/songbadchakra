import { NextResponse } from 'next/server'
import { getAllSources, getSourceById } from '@/lib/news-repository'
import { ingestSource, type IngestionResult } from '@/lib/rss-ingestion'
import { runAutomationCycle } from '@/lib/ai/job-recovery'
import { getPipelineItemsPerRun } from '@/lib/ai/pipeline'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * Runs the self-healing automation cycle (stale-job recovery, retries,
 * dead-letter processing and queued-job execution) BEFORE fresh ingestion —
 * recovery is guaranteed to run even when ingestion later hits errors.
 * Recovery is best-effort — failures never abort the ingestion pass.
 */
async function runRecovery(queuedLimit?: number) {
  try {
    return await runAutomationCycle({ queuedLimit })
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

/**
 * Builds a synthetic failed IngestionResult so one broken source never aborts
 * the remaining sources (and the response still reports totals).
 */
function failedSourceResult(sourceId: string, sourceName: string, error: unknown): IngestionResult {
  const message = error instanceof Error ? error.message : String(error)
  return {
    sourceId,
    sourceName,
    fetchedCount: 0,
    ingestedCount: 0,
    skippedCount: 0,
    failedCount: 1,
    pipelineCount: 0,
    queuedCount: 0,
    errors: [`Source error: ${message}`],
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

    // Self-healing first: stale jobs are recovered and queued jobs processed
    // within the shared per-invocation subrequest budget. Whatever recovery
    // consumed is subtracted from the ingestion pipeline budget below.
    const budget = getPipelineItemsPerRun()
    const recovery = await runRecovery(budget)
    let remainingBudget = Math.max(0, budget - (recovery.processedQueued ?? 0))

    if (sourceId) {
      const source = await getSourceById(sourceId)
      if (!source) {
        return NextResponse.json({ error: 'সোর্স পাওয়া যায়নি।' }, { status: 404 })
      }
      try {
        const res = await ingestSource(source, { maxPipelineItems: remainingBudget })
        remainingBudget -= res.pipelineCount
        results.push(res)
      } catch (err) {
        results.push(failedSourceResult(source.id, source.name, err))
      }
    } else {
      const allSources = await getAllSources()
      const activeSources = allSources.filter((s) => s.isActive)

      for (const source of activeSources) {
        try {
          const res = await ingestSource(source, { maxPipelineItems: Math.max(0, remainingBudget) })
          remainingBudget -= res.pipelineCount
          results.push(res)
        } catch (err) {
          results.push(failedSourceResult(source.id, source.name, err))
        }
      }
    }

    const totalFetched = results.reduce((acc, r) => acc + r.fetchedCount, 0)
    const totalIngested = results.reduce((acc, r) => acc + r.ingestedCount, 0)
    const totalSkipped = results.reduce((acc, r) => acc + r.skippedCount, 0)
    const totalFailed = results.reduce((acc, r) => acc + r.failedCount, 0)
    const totalQueued = results.reduce((acc, r) => acc + r.queuedCount, 0)

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          totalFetched,
          totalIngested,
          totalSkipped,
          totalFailed,
          totalQueued,
          pipelineBudget: budget,
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

import { NextResponse } from 'next/server'
import { runAutomationCycle } from '@/lib/ai/job-recovery'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * Standalone cron endpoint for the recovery/retry/dead-letter cycle only
 * (no RSS ingestion). Used by operators, dashboards and can be wired to a
 * separate shorter-interval trigger if desired.
 */
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস। সঠিক CRON_SECRET প্রয়োজন।' }, { status: 401 })
  }
  const summary = await runAutomationCycle()
  return NextResponse.json(
    { success: true, recovery: summary },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}

export async function POST(request: Request) {
  return GET(request)
}
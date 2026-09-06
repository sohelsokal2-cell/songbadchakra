import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { runAutomationCycle } from '@/lib/ai/job-recovery'

/**
 * Admin endpoint: manually trigger the recovery/dispatch cycle
 * (recover stale jobs, requeue retryable failures, dead-letter exhausted jobs,
 * and run any queued jobs).
 */
export async function POST() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const recovery = await runAutomationCycle()
    return NextResponse.json({ success: true, recovery })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
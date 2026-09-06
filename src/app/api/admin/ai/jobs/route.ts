import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiJobs } from '@/lib/ai/ai-repository'
import type { AiJobStatus } from '@/types/ai'

export async function GET(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || 'all') as AiJobStatus | 'all'
    const limit = Number(searchParams.get('limit') || '20')
    const page = Number(searchParams.get('page') || '1')

    const result = await getAiJobs({ status, limit, page })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

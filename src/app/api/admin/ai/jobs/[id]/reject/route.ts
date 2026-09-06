import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { rejectJob } from '@/lib/ai/ai-repository'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = body?.reason || 'বাতিল করা হয়েছে'
    const success = await rejectJob(id, reason)
    if (!success) {
      return NextResponse.json({ error: 'Failed to reject job' }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'জবটি বাতিল করা হয়েছে।' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

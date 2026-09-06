import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { requeueJob } from '@/lib/ai/job-recovery'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { id } = await params
    const success = await requeueJob(id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to requeue job' }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'জবটি পুনরায় চালুর জন্য সারিতে রাখা হয়েছে।' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
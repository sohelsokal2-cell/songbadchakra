import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAllAiLogs } from '@/lib/news-repository'

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  const logs = await getAllAiLogs(limit)
  return NextResponse.json({ logs })
}

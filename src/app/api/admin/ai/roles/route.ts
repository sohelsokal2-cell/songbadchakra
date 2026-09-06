import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiRoles } from '@/lib/ai/ai-repository'

export async function GET() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const roles = await getAiRoles()
    return NextResponse.json({ success: true, roles })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

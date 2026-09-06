import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiRuleConfig, updateAiRuleConfig } from '@/lib/ai/ai-repository'
import { clearRuleConfigCache } from '@/lib/ai/rule-engine'

export async function GET() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const config = await getAiRuleConfig()
    return NextResponse.json({ success: true, config })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const body = await req.json()
    const config = await updateAiRuleConfig(body)
    // The automation pipeline caches the rule config for ~60s; invalidate it
    // immediately so admin changes take effect on the very next cron run.
    clearRuleConfigCache()
    return NextResponse.json({ success: true, config })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

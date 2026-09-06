import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getApiKeyLabels, createApiKeyLabel } from '@/lib/ai/ai-repository'

export async function GET(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId') || undefined
    const keys = await getApiKeyLabels(providerId)
    return NextResponse.json({ success: true, keys })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.providerId || !body.label || !body.displayLabel) {
      return NextResponse.json({ error: 'providerId, label, and displayLabel are required' }, { status: 400 })
    }

    const key = await createApiKeyLabel({
      providerId: body.providerId,
      label: body.label,
      displayLabel: body.displayLabel,
      priority: body.priority,
    })

    if (!key) {
      return NextResponse.json({ error: 'Failed to create API key label' }, { status: 500 })
    }

    return NextResponse.json({ success: true, key }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

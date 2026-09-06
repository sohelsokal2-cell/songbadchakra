import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiModels, createAiModel } from '@/lib/ai/ai-repository'

export async function GET(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId') || undefined
    const models = await getAiModels(providerId)
    return NextResponse.json({ success: true, models })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.providerId || !body.modelName || !body.displayName) {
      return NextResponse.json({ error: 'providerId, modelName, and displayName are required' }, { status: 400 })
    }

    const model = await createAiModel({
      providerId: body.providerId,
      modelName: body.modelName,
      displayName: body.displayName,
      contextLength: body.contextLength,
    })

    if (!model) {
      return NextResponse.json({ error: 'Failed to create AI model' }, { status: 500 })
    }

    return NextResponse.json({ success: true, model }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

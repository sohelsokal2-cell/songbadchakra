import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiProviders, createAiProvider } from '@/lib/ai/ai-repository'

export async function GET() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const providers = await getAiProviders()
    return NextResponse.json({ success: true, providers })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.providerName || !body.displayName || !body.baseUrl) {
      return NextResponse.json({ error: 'providerName, displayName, and baseUrl are required' }, { status: 400 })
    }

    const provider = await createAiProvider({
      providerName: body.providerName,
      displayName: body.displayName,
      baseUrl: body.baseUrl,
      apiStyle: body.apiStyle || 'openai',
      isActive: body.isActive ?? true,
    })

    if (!provider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true, provider }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

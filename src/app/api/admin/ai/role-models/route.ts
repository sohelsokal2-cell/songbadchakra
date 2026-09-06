import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAiRoleModels, createAiRoleModel } from '@/lib/ai/ai-repository'

export async function GET(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const roleId = searchParams.get('roleId') || undefined
    const roleModels = await getAiRoleModels(roleId)
    return NextResponse.json({ success: true, roleModels })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.roleId || !body.modelId) {
      return NextResponse.json({ error: 'roleId and modelId are required' }, { status: 400 })
    }

    const roleModel = await createAiRoleModel({
      roleId: body.roleId,
      modelId: body.modelId,
      apiKeyLabelId: body.apiKeyLabelId,
      priority: body.priority,
      maxRetries: body.maxRetries,
      timeoutMs: body.timeoutMs,
    })

    if (!roleModel) {
      return NextResponse.json({ error: 'Failed to create role model assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, roleModel }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

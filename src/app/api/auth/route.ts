import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE_NAME,
  validateCredentials,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action = 'login', email, password } = body

    const cookieStore = await cookies()

    if (action === 'logout') {
      cookieStore.delete(ADMIN_COOKIE_NAME)
      return NextResponse.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে।' })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' },
          { status: 400 }
        )
      }

      const isValid = validateCredentials(email, password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' },
          { status: 401 }
        )
      }

      const token = generateSessionToken(email)

      cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'সফলভাবে লগইন হয়েছে।',
        user: {
          email,
          role: 'administrator',
          name: 'প্রধান সম্পাদক',
        },
      })
    }

    return NextResponse.json({ error: 'অবৈধ অনুরোধ।' }, { status: 400 })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'সার্ভার সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
    const session = verifySessionToken(token)

    if (!session.valid) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: 'প্রধান সম্পাদক',
        role: 'administrator',
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

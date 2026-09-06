import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import {
  getContactMessages,
  markContactMessageRead,
  deleteContactMessage,
} from '@/lib/news-repository'

export async function GET() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const messages = await getContactMessages()
  return NextResponse.json({ messages })
}

export async function PATCH(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    const { id, read } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'আইডি প্রয়োজন।' }, { status: 400 })
    }

    if (typeof read !== 'boolean') return NextResponse.json({ error: 'read অবশ্যই boolean হতে হবে।' }, { status: 400 })
    const success = await markContactMessageRead(id, read)
    return NextResponse.json({ success })
  } catch (err) {
    console.error('Error updating message:', err)
    return NextResponse.json({ error: 'বার্তা আপডেট ব্যর্থ হয়েছে।' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'আইডি প্রয়োজন।' }, { status: 400 })
    }

    const success = await deleteContactMessage(id)
    return NextResponse.json({ success })
  } catch (err) {
    console.error('Error deleting message:', err)
    return NextResponse.json({ error: 'বার্তা মুছতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}

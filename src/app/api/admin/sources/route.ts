import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import {
  getAllSources,
  createSource,
  updateSource,
  deleteSource,
  getSourceById,
} from '@/lib/news-repository'

function isValidUrl(urlString: unknown): boolean {
  try {
    const parsed = new URL(String(urlString))
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET() {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const sources = await getAllSources()
  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, url, feedUrl, category, categoryLabel, fetchIntervalMinutes } = body

    if (!name || !url || !feedUrl || !category) {
      return NextResponse.json(
        { error: 'নাম, ওয়েব URL, RSS ফিড URL এবং ক্যাটাগরি আবশ্যক।' },
        { status: 400 }
      )
    }

    if (!isValidUrl(url) || !isValidUrl(feedUrl)) {
      return NextResponse.json(
        { error: 'বৈধ HTTP/HTTPS URL প্রদান করুন।' },
        { status: 400 }
      )
    }

    // Check duplicate feed_url
    const existing = await getAllSources()
    if (existing.some((s) => s.feedUrl.toLowerCase() === String(feedUrl).toLowerCase())) {
      return NextResponse.json(
        { error: 'এই ফিড URL টি ইতিমধ্যে যুক্ত রয়েছে।' },
        { status: 409 }
      )
    }

    const created = await createSource({
      name: String(name).trim(),
      url: String(url).trim(),
      feedUrl: String(feedUrl).trim(),
      category: String(category).trim(),
      categoryLabel: String(categoryLabel || 'সাধারণ').trim(),
      isActive: true,
      fetchIntervalMinutes: Number(fetchIntervalMinutes) || 60,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ফিড উৎস তৈরি করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, isActive, fetchIntervalMinutes, category, categoryLabel, name } = body

    if (!id) {
      return NextResponse.json({ error: 'সোর্স আইডি আবশ্যক।' }, { status: 400 })
    }

    const source = await getSourceById(id)
    if (!source) {
      return NextResponse.json({ error: 'সোর্স পাওয়া যায়নি।' }, { status: 404 })
    }

    const updated = await updateSource(id, {
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(fetchIntervalMinutes ? { fetchIntervalMinutes: Number(fetchIntervalMinutes) } : {}),
      ...(category ? { category: String(category).trim() } : {}),
      ...(categoryLabel ? { categoryLabel: String(categoryLabel).trim() } : {}),
      ...(name ? { name: String(name).trim() } : {}),
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'আপডেট করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'সোর্স আইডি আবশ্যক।' }, { status: 400 })
    }

    const deleted = await deleteSource(id)
    if (!deleted) {
      return NextResponse.json({ error: 'সোর্স পাওয়া যায়নি।' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ডিলিট করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    )
  }
}

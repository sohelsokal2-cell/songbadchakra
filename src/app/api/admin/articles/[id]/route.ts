import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { DuplicateSlugError, getArticleById, updateArticle, deleteArticle, toggleBreakingNews } from '@/lib/news-repository'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { id } = await params
  const article = await getArticleById(id)
  if (!article) {
    return NextResponse.json({ error: 'সংবাদটি খুঁজে পাওয়া যায়নি।' }, { status: 404 })
  }

  return NextResponse.json(article)
}

export async function PUT(request: Request, { params }: Params) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'অবৈধ সংবাদ তথ্য।' }, { status: 400 })
    }
    const allowed = ['title', 'slug', 'summary', 'content', 'category', 'categoryLabel', 'sourceName', 'sourceUrl', 'imageUrl', 'publishedAt', 'isBreaking', 'status', 'division', 'district', 'isVideo', 'videoDuration', 'isOpinion', 'isPhotoFeature', 'readingTime', 'tags', 'author']
    const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
    if ('id' in body) return NextResponse.json({ error: 'আইডি পরিবর্তন করা যাবে না।' }, { status: 400 })
    if (body.status === 'draft') update.isBreaking = false
    if (body.slug !== undefined && (typeof body.slug !== 'string' || !body.slug.trim())) {
      return NextResponse.json({ error: 'একটি বৈধ স্লাগ প্রয়োজন।' }, { status: 400 })
    }
    if (body.imageUrl !== undefined) {
      try {
        const image = new URL(String(body.imageUrl))
        if (image.protocol !== 'https:' || !['picsum.photos', 'images.unsplash.com'].includes(image.hostname)) throw new Error()
      } catch {
        return NextResponse.json({ error: 'ছবির URL অনুমোদিত হোস্ট থেকে হতে হবে।' }, { status: 400 })
      }
    }
    const updated = await updateArticle(id, update)
    if (!updated) {
      return NextResponse.json({ error: 'সংবাদটি খুঁজে পাওয়া যায়নি।' }, { status: 404 })
    }

    return NextResponse.json({ success: true, article: updated })
  } catch (err) {
    if (err instanceof DuplicateSlugError) {
      return NextResponse.json({ error: 'এই স্লাগটি ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 409 })
    }
    console.error('Error updating article:', err)
    return NextResponse.json({ error: 'সংবাদ আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { id } = await params
  const deleted = await deleteArticle(id)
  if (!deleted) {
    return NextResponse.json({ error: 'সংবাদটি খুঁজে পাওয়া যায়নি।' }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: 'সংবাদটি মুছে ফেলা হয়েছে।' })
}

export async function PATCH(request: Request, { params }: Params) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  if (body.isBreaking !== undefined) {
    const updated = await updateArticle(id, { isBreaking: Boolean(body.isBreaking) })
    if (!updated) {
      return NextResponse.json({ error: 'সংবাদটি খুঁজে পাওয়া যায়নি।' }, { status: 404 })
    }
    return NextResponse.json({ success: true, isBreaking: updated.isBreaking })
  }

  if (body.action === 'toggle-breaking' || !body.action) {
    const isBreaking = await toggleBreakingNews(id)
    if (isBreaking === null) {
      return NextResponse.json({ error: 'সংবাদটি খুঁজে পাওয়া যায়নি।' }, { status: 404 })
    }
    return NextResponse.json({ success: true, isBreaking })
  }

  return NextResponse.json({ error: 'অবৈধ অ্যাকশন।' }, { status: 400 })
}

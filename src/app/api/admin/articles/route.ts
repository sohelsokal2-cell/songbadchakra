import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getAllArticles, createArticle, DuplicateSlugError } from '@/lib/news-repository'
import { isAllowedImageUrl } from '@/lib/utils'

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined
  const status = (searchParams.get('status') as 'all' | 'published' | 'draft') || undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const result = await getAllArticles({ category, status, search, page, limit })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin()
  if (!isAuth) {
    return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug, summary, content, category, categoryLabel, imageUrl } = body

    if (!title || !slug || !content || !category) {
      return NextResponse.json(
        { error: 'শিরোনাম, স্লাগ, কন্টেন্ট এবং ক্যাটাগরি আবশ্যক।' },
        { status: 400 }
      )
    }

    if (imageUrl && !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: 'ছবির URL অনুমোদিত হোস্ট থেকে হতে হবে।' }, { status: 400 })
    }

    const created = await createArticle({
      title: title.trim(),
      slug: slug.trim(),
      summary: summary?.trim() || '',
      content: content.trim(),
      category: category.trim(),
      categoryLabel: categoryLabel || 'সাধারণ',
      sourceName: body.sourceName || 'সংবাদচক্র ডেস্ক',
      sourceUrl: body.sourceUrl || '#',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
      publishedAt: body.publishedAt || new Date().toISOString(),
      isBreaking: body.status !== 'draft' && Boolean(body.isBreaking),
      status: body.status === 'draft' ? 'draft' : 'published',
      division: body.division || undefined,
      district: body.district || undefined,
      isVideo: Boolean(body.isVideo),
      videoDuration: body.videoDuration || undefined,
      isOpinion: Boolean(body.isOpinion),
      author: body.author || { name: 'নিজস্ব প্রতিবেদক' },
    })

    return NextResponse.json({ success: true, article: created }, { status: 201 })
  } catch (err) {
    if (err instanceof DuplicateSlugError) {
      return NextResponse.json({ error: 'এই স্লাগটি ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 409 })
    }
    console.error('Error creating article:', err)
    return NextResponse.json({ error: 'সংবাদ তৈরি করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}

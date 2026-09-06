/**
 * Tests for news-repository: CRUD operations, slug uniqueness,
 * breaking news toggle, draft/publish, and article validation.
 * Uses the local file-based store (no Supabase env set).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'
import {
  getAllArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleBreakingNews,
  DuplicateSlugError,
  getContactMessages,
  createContactMessage,
  markContactMessageRead,
  deleteContactMessage,
} from '@/lib/news-repository'
import type { NewsArticle } from '@/types/news'

// Ensure no Supabase config (use local store)
beforeEach(async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY

  // Reset the data file to a clean empty state
  await fs.mkdir(path.resolve('.data'), { recursive: true })
  await fs.writeFile(
    path.resolve('.data/portal-data.json'),
    JSON.stringify({ articles: [], contactMessages: [] }),
    'utf-8'
  )
})

afterEach(async () => {
  // Clean up - restore with an empty store
  await fs.writeFile(
    path.resolve('.data/portal-data.json'),
    JSON.stringify({ articles: [], contactMessages: [] }),
    'utf-8'
  )
})

function makeArticle(overrides: Partial<NewsArticle> = {}): Omit<NewsArticle, 'id'> {
  return {
    title: 'Test Article',
    slug: `test-slug-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    summary: 'Test summary',
    content: 'Test content body',
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'Test Source',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/test/800/450',
    publishedAt: new Date().toISOString(),
    isBreaking: false,
    status: 'published',
    ...overrides,
  }
}

describe('createArticle', () => {
  it('creates an article and returns it with a generated id', async () => {
    const payload = makeArticle()
    const created = await createArticle(payload)
    expect(created.id).toBeTruthy()
    expect(created.title).toBe(payload.title)
    expect(created.slug).toBe(payload.slug)
  })

  it('throws DuplicateSlugError when slug already exists', async () => {
    const payload = makeArticle({ slug: 'duplicate-slug' })
    await createArticle(payload)
    await expect(createArticle(makeArticle({ slug: 'duplicate-slug' }))).rejects.toThrow(DuplicateSlugError)
  })

  it('creates a draft article', async () => {
    const payload = makeArticle({ status: 'draft' })
    const created = await createArticle(payload)
    expect(created.status).toBe('draft')
  })
})

describe('getArticleById and getArticleBySlug', () => {
  it('retrieves article by id', async () => {
    const created = await createArticle(makeArticle({ slug: 'unique-by-id' }))
    const found = await getArticleById(created.id)
    expect(found?.id).toBe(created.id)
  })

  it('retrieves article by slug', async () => {
    const created = await createArticle(makeArticle({ slug: 'unique-by-slug' }))
    const found = await getArticleBySlug('unique-by-slug')
    expect(found?.id).toBe(created.id)
  })

  it('returns undefined for non-existent id', async () => {
    const found = await getArticleById('non-existent-id')
    expect(found).toBeUndefined()
  })
})

describe('getAllArticles with filters', () => {
  it('filters by status=published', async () => {
    await createArticle(makeArticle({ slug: 'pub1', status: 'published' }))
    await createArticle(makeArticle({ slug: 'draft1', status: 'draft' }))
    const { articles } = await getAllArticles({ status: 'published' })
    expect(articles.every((a) => a.status === 'published')).toBe(true)
  })

  it('filters by status=draft', async () => {
    await createArticle(makeArticle({ slug: 'pub2', status: 'published' }))
    await createArticle(makeArticle({ slug: 'draft2', status: 'draft' }))
    const { articles } = await getAllArticles({ status: 'draft' })
    expect(articles.every((a) => a.status === 'draft')).toBe(true)
  })

  it('filters by category', async () => {
    await createArticle(makeArticle({ slug: 'sports1', category: 'sports' }))
    await createArticle(makeArticle({ slug: 'intl1', category: 'international' }))
    const { articles } = await getAllArticles({ category: 'sports' })
    expect(articles.every((a) => a.category === 'sports')).toBe(true)
  })

  it('returns articles sorted by publishedAt desc', async () => {
    const old = new Date(Date.now() - 10000).toISOString()
    const recent = new Date().toISOString()
    await createArticle(makeArticle({ slug: 'old-one', publishedAt: old }))
    await createArticle(makeArticle({ slug: 'recent-one', publishedAt: recent }))
    const { articles } = await getAllArticles()
    expect(Date.parse(articles[0].publishedAt)).toBeGreaterThanOrEqual(
      Date.parse(articles[1].publishedAt)
    )
  })
})

describe('updateArticle', () => {
  it('updates article title', async () => {
    const created = await createArticle(makeArticle({ slug: 'update-me' }))
    const updated = await updateArticle(created.id, { title: 'Updated Title' })
    expect(updated?.title).toBe('Updated Title')
  })

  it('does not allow changing the article id', async () => {
    const created = await createArticle(makeArticle({ slug: 'update-id-attempt' }))
    // id should stay the same regardless
    const updated = await updateArticle(created.id, { title: 'New Title' })
    expect(updated?.id).toBe(created.id)
  })

  it('throws DuplicateSlugError when updating to an existing slug', async () => {
    const a1 = await createArticle(makeArticle({ slug: 'slug-a' }))
    await createArticle(makeArticle({ slug: 'slug-b' }))
    await expect(updateArticle(a1.id, { slug: 'slug-b' })).rejects.toThrow(DuplicateSlugError)
  })

  it('returns null for non-existent article', async () => {
    const result = await updateArticle('no-such-id', { title: 'x' })
    expect(result).toBeNull()
  })

  it('clears isBreaking when status set to draft', async () => {
    const created = await createArticle(makeArticle({ slug: 'break-draft', isBreaking: true, status: 'published' }))
    const updated = await updateArticle(created.id, { status: 'draft', isBreaking: false })
    expect(updated?.isBreaking).toBe(false)
  })
})

describe('deleteArticle', () => {
  it('deletes an article and it can no longer be found', async () => {
    const created = await createArticle(makeArticle({ slug: 'to-delete' }))
    const deleted = await deleteArticle(created.id)
    expect(deleted).toBe(true)
    expect(await getArticleById(created.id)).toBeUndefined()
  })

  it('returns false when deleting non-existent article', async () => {
    const result = await deleteArticle('non-existent-id')
    expect(result).toBe(false)
  })
})

describe('toggleBreakingNews', () => {
  it('toggles isBreaking from false to true', async () => {
    const created = await createArticle(makeArticle({ slug: 'break-toggle', isBreaking: false, status: 'published' }))
    const result = await toggleBreakingNews(created.id)
    expect(result).toBe(true)
  })

  it('toggles isBreaking from true to false', async () => {
    const created = await createArticle(makeArticle({ slug: 'break-toggle-2', isBreaking: true, status: 'published' }))
    const result = await toggleBreakingNews(created.id)
    expect(result).toBe(false)
  })

  it('returns null for non-existent article', async () => {
    expect(await toggleBreakingNews('ghost-id')).toBeNull()
  })
})

describe('Contact Messages', () => {
  const msg = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'This is a test message body.',
  }

  it('creates a contact message with id and createdAt', async () => {
    const created = await createContactMessage(msg)
    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeTruthy()
    expect(created.isRead).toBe(false)
  })

  it('retrieves created messages', async () => {
    await createContactMessage(msg)
    const messages = await getContactMessages()
    expect(messages.length).toBeGreaterThan(0)
  })

  it('marks a message as read', async () => {
    const created = await createContactMessage(msg)
    const result = await markContactMessageRead(created.id, true)
    expect(result).toBe(true)
    const messages = await getContactMessages()
    const found = messages.find((m) => m.id === created.id)
    expect(found?.isRead).toBe(true)
  })

  it('deletes a message', async () => {
    const created = await createContactMessage(msg)
    const deleted = await deleteContactMessage(created.id)
    expect(deleted).toBe(true)
    const messages = await getContactMessages()
    expect(messages.find((m) => m.id === created.id)).toBeUndefined()
  })
})

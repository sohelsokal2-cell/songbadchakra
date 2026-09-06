import fs from 'fs/promises'
import path from 'path'
import { type NewsArticle, type ContactMessage } from '@/types/news'
import { mockNews } from '@/data/mockNews'

const DATA_FILE = path.join(process.cwd(), '.data', 'portal-data.json')

interface PortalDataStore {
  articles: NewsArticle[]
  contactMessages: ContactMessage[]
}

export interface ArticleFilters {
  status?: 'all' | 'published' | 'draft'
  category?: string
  search?: string
  limit?: number
  page?: number
}

export class DuplicateSlugError extends Error {
  constructor() {
    super('Slug already exists.')
    this.name = 'DuplicateSlugError'
  }
}

let writeQueue = Promise.resolve()

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
  if (process.env.NODE_ENV === 'production' && !isProductionBuild && (!url || !key)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.')
  }
  return url && key ? { url, key } : null
}

async function supabaseRequest<T>(resource: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) throw new Error('Supabase is not configured.')

  const response = await fetch(`${config.url}/rest/v1/${resource}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function loadLocalStore(): Promise<PortalDataStore> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as PortalDataStore
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seed = { articles: [...mockNews], contactMessages: [] }
    await saveLocalStore(seed)
    return seed
  }
}

async function saveLocalStore(data: PortalDataStore): Promise<void> {
  const operation = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`
    await fs.writeFile(temporaryFile, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(temporaryFile, DATA_FILE)
  })
  writeQueue = operation.catch(() => undefined)
  await operation
}

async function mutateLocalStore<T>(mutation: (store: PortalDataStore) => T): Promise<T> {
  let result!: T
  const operation = writeQueue.then(async () => {
    let store: PortalDataStore
    try {
      store = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')) as PortalDataStore
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      store = { articles: [...mockNews], contactMessages: [] }
    }
    result = mutation(store)
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`
    await fs.writeFile(temporaryFile, JSON.stringify(store, null, 2), 'utf-8')
    await fs.rename(temporaryFile, DATA_FILE)
  })
  writeQueue = operation.catch(() => undefined)
  await operation
  return result
}

function normalizeArticle(row: Record<string, unknown>): NewsArticle {
  return {
    id: String(row.id), title: String(row.title), slug: String(row.slug),
    summary: String(row.summary ?? ''), content: String(row.content), category: String(row.category),
    categoryLabel: String(row.category_label), sourceName: String(row.source_name),
    sourceUrl: String(row.source_url), imageUrl: String(row.image_url),
    publishedAt: String(row.published_at), isBreaking: Boolean(row.is_breaking),
    status: row.status === 'draft' ? 'draft' : 'published',
    author: row.author as NewsArticle['author'], division: row.division as string | undefined,
    district: row.district as string | undefined, isVideo: Boolean(row.is_video),
    videoDuration: row.video_duration as string | undefined, isOpinion: Boolean(row.is_opinion),
    isPhotoFeature: Boolean(row.is_photo_feature), readingTime: row.reading_time as number | undefined,
    tags: row.tags as string[] | undefined,
  }
}

function serializeArticle(article: NewsArticle) {
  return {
    id: article.id, title: article.title, slug: article.slug, summary: article.summary,
    content: article.content, category: article.category, category_label: article.categoryLabel,
    source_name: article.sourceName, source_url: article.sourceUrl, image_url: article.imageUrl,
    published_at: article.publishedAt, is_breaking: article.isBreaking, status: article.status,
    author: article.author, division: article.division, district: article.district,
    is_video: article.isVideo ?? false, video_duration: article.videoDuration,
    is_opinion: article.isOpinion ?? false, is_photo_feature: article.isPhotoFeature ?? false,
    reading_time: article.readingTime, tags: article.tags,
  }
}

function normalizeMessage(row: Record<string, unknown>): ContactMessage {
  const read = Boolean(row.is_read)
  return {
    id: String(row.id), name: String(row.name), email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined, subject: String(row.subject),
    message: String(row.message), isRead: read, read, createdAt: String(row.created_at),
  }
}

async function allArticles(): Promise<NewsArticle[]> {
  if (!getSupabaseConfig()) return (await loadLocalStore()).articles
  const rows = await supabaseRequest<Record<string, unknown>[]>('articles?select=*')
  return rows.map(normalizeArticle)
}

export async function getAllArticles(filters: ArticleFilters = {}) {
  let list = await allArticles()
  if (filters.status && filters.status !== 'all') list = list.filter((a) => a.status === filters.status)
  if (filters.category && filters.category !== 'all') list = list.filter((a) => a.category === filters.category)
  if (filters.search) {
    const q = filters.search.toLowerCase().trim()
    list = list.filter((a) => `${a.title} ${a.summary} ${a.categoryLabel}`.toLowerCase().includes(q))
  }
  list.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const total = list.length
  const page = Number.isFinite(filters.page) && (filters.page ?? 0) > 0 ? filters.page! : 1
  const limit = Number.isFinite(filters.limit) && (filters.limit ?? 0) > 0 ? Math.min(filters.limit!, 100) : 50
  return { articles: list.slice((page - 1) * limit, page * limit), total, page, totalPages: Math.ceil(total / limit) }
}

export async function getArticleById(id: string) {
  return (await allArticles()).find((article) => article.id === id)
}

export async function getArticleBySlug(slug: string) {
  return (await allArticles()).find((article) => article.slug === slug)
}

export async function createArticle(payload: Omit<NewsArticle, 'id'>) {
  if ((await getArticleBySlug(payload.slug))) throw new DuplicateSlugError()
  const article = { ...payload, id: crypto.randomUUID(), publishedAt: payload.publishedAt || new Date().toISOString() }
  if (getSupabaseConfig()) {
    const [created] = await supabaseRequest<Record<string, unknown>[]>('articles', {
      method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(serializeArticle(article)),
    })
    return normalizeArticle(created)
  }
  await mutateLocalStore((store) => store.articles.unshift(article))
  return article
}

export async function updateArticle(id: string, payload: Partial<Omit<NewsArticle, 'id'>>) {
  const current = await getArticleById(id)
  if (!current) return null
  if (payload.slug && payload.slug !== current.slug && (await getArticleBySlug(payload.slug))) {
    throw new DuplicateSlugError()
  }
  const article = { ...current, ...payload, id }
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(`articles?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(serializeArticle(article)),
    })
    return rows[0] ? normalizeArticle(rows[0]) : null
  }
  await mutateLocalStore((store) => {
    const index = store.articles.findIndex((item) => item.id === id)
    if (index >= 0) store.articles[index] = article
  })
  return article
}

export async function deleteArticle(id: string) {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(`articles?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { Prefer: 'return=representation' },
    })
    return rows.length > 0
  }
  return mutateLocalStore((store) => {
    const initialLength = store.articles.length
    store.articles = store.articles.filter((article) => article.id !== id)
    return store.articles.length < initialLength
  })
}

export async function toggleBreakingNews(id: string) {
  const article = await getArticleById(id)
  if (!article) return null
  const updated = await updateArticle(id, { isBreaking: !article.isBreaking })
  return updated?.isBreaking ?? null
}

export async function getDashboardStats() {
  const [articles, messages] = await Promise.all([allArticles(), getContactMessages()])
  const published = articles.filter((a) => a.status === 'published')
  const breakingNewsCount = published.filter((a) => a.isBreaking).length
  return {
    totalArticles: articles.length, publishedArticles: published.length,
    draftArticles: articles.filter((a) => a.status === 'draft').length,
    breakingNewsCount, breakingCount: breakingNewsCount,
    opinionCount: articles.filter((a) => a.isOpinion).length,
    unreadMessages: messages.filter((m) => !m.read).length, totalMessages: messages.length,
  }
}

export async function getContactMessages() {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>('contact_messages?select=*&order=created_at.desc')
    return rows.map(normalizeMessage)
  }
  return [...(await loadLocalStore()).contactMessages]
    .map((message) => ({ ...message, read: message.read ?? message.isRead ?? false, isRead: message.isRead ?? message.read ?? false }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export async function createContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead' | 'read'>) {
  const created: ContactMessage = { ...message, id: crypto.randomUUID(), createdAt: new Date().toISOString(), isRead: false, read: false }
  if (getSupabaseConfig()) {
    const [row] = await supabaseRequest<Record<string, unknown>[]>('contact_messages', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id: created.id, name: created.name, email: created.email, phone: created.phone, subject: created.subject, message: created.message, is_read: false, created_at: created.createdAt }),
    })
    return normalizeMessage(row)
  }
  await mutateLocalStore((store) => store.contactMessages.unshift(created))
  return created
}

export async function markContactMessageRead(id: string, isRead: boolean) {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(`contact_messages?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ is_read: isRead }),
    })
    return rows.length > 0
  }
  return mutateLocalStore((store) => {
    const message = store.contactMessages.find((item) => item.id === id)
    if (!message) return false
    message.isRead = isRead
    message.read = isRead
    return true
  })
}

export async function deleteContactMessage(id: string) {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(`contact_messages?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { Prefer: 'return=representation' },
    })
    return rows.length > 0
  }
  return mutateLocalStore((store) => {
    const initialLength = store.contactMessages.length
    store.contactMessages = store.contactMessages.filter((message) => message.id !== id)
    return store.contactMessages.length < initialLength
  })
}

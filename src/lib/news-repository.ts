import fs from 'fs/promises'
import path from 'path'
import { type NewsArticle, type ContactMessage, type NewsSource, type AiLog } from '@/types/news'
import { mockNews } from '@/data/mockNews'

function getDataFilePath() {
  return process.env.PORTAL_DATA_PATH || path.join(process.cwd(), '.data', 'portal-data.json')
}

export const DEFAULT_SOURCES: NewsSource[] = [
  {
    id: 'src-bbc-bangla',
    name: 'BBC News বাংলা',
    url: 'https://www.bbc.com/bengali',
    feedUrl: 'https://feeds.bbci.co.uk/bengali/rss.xml',
    category: 'international',
    categoryLabel: 'আন্তর্জাতিক',
    isActive: true,
    fetchIntervalMinutes: 60,
    createdAt: '2026-09-06T00:00:00.000Z',
  },
  {
    id: 'src-prothom-alo',
    name: 'প্রথম আলো',
    url: 'https://www.prothomalo.com',
    feedUrl: 'https://www.prothomalo.com/feed',
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    isActive: true,
    fetchIntervalMinutes: 60,
    createdAt: '2026-09-06T00:00:00.000Z',
  },
  {
    id: 'src-daily-star',
    name: 'ডেইলি স্টার বাংলা',
    url: 'https://bangla.thedailystar.net',
    feedUrl: 'https://bangla.thedailystar.net/feed',
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    isActive: true,
    fetchIntervalMinutes: 60,
    createdAt: '2026-09-06T00:00:00.000Z',
  },
]

interface PortalDataStore {
  articles: NewsArticle[]
  contactMessages: ContactMessage[]
  sources?: NewsSource[]
  aiLogs?: AiLog[]
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

  if (init.method === 'DELETE' && !resource.includes('?id=eq.')) {
    throw new Error(`Unsafe operation rejected: DELETE on '${resource}' without explicit id filter.`)
  }

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
  const dataFile = getDataFilePath()
  try {
    const store = JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ dataFile, 'utf-8')) as PortalDataStore
    store.sources = store.sources ?? [...DEFAULT_SOURCES]
    store.aiLogs = store.aiLogs ?? []
    return store
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seed: PortalDataStore = {
      articles: [...mockNews],
      contactMessages: [],
      sources: [...DEFAULT_SOURCES],
      aiLogs: [],
    }
    await saveLocalStore(seed)
    return seed
  }
}

async function saveLocalStore(data: PortalDataStore): Promise<void> {
  const dataFile = getDataFilePath()
  const operation = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true })
    const temporaryFile = `${dataFile}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
    await fs.writeFile(temporaryFile, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(temporaryFile, dataFile)
  })
  writeQueue = operation.catch(() => undefined)
  await operation
}

async function mutateLocalStore<T>(mutation: (store: PortalDataStore) => T): Promise<T> {
  const dataFile = getDataFilePath()
  let result!: T
  const operation = writeQueue.then(async () => {
    let store: PortalDataStore
    try {
      store = JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ dataFile, 'utf-8')) as PortalDataStore
      store.sources = store.sources ?? [...DEFAULT_SOURCES]
      store.aiLogs = store.aiLogs ?? []
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      store = {
        articles: [...mockNews],
        contactMessages: [],
        sources: [...DEFAULT_SOURCES],
        aiLogs: [],
      }
    }
    result = mutation(store)
    await fs.mkdir(path.dirname(dataFile), { recursive: true })
    const temporaryFile = `${dataFile}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
    await fs.writeFile(temporaryFile, JSON.stringify(store, null, 2), 'utf-8')
    await fs.rename(temporaryFile, dataFile)
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

function normalizeSource(row: Record<string, unknown>): NewsSource {
  return {
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    feedUrl: String(row.feed_url),
    category: String(row.category),
    categoryLabel: String(row.category_label),
    isActive: Boolean(row.is_active),
    fetchIntervalMinutes: Number(row.fetch_interval_minutes ?? 60),
    lastFetchedAt: row.last_fetched_at ? String(row.last_fetched_at) : undefined,
    lastStatus: row.last_status as NewsSource['lastStatus'],
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function serializeSource(source: NewsSource) {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    feed_url: source.feedUrl,
    category: source.category,
    category_label: source.categoryLabel,
    is_active: source.isActive,
    fetch_interval_minutes: source.fetchIntervalMinutes,
    last_fetched_at: source.lastFetchedAt,
    last_status: source.lastStatus,
    error_message: source.errorMessage,
    created_at: source.createdAt,
  }
}

function normalizeAiLog(row: Record<string, unknown>): AiLog {
  return {
    id: String(row.id),
    sourceId: row.source_id ? String(row.source_id) : undefined,
    sourceUrl: String(row.source_url),
    provider: String(row.provider ?? 'gemini'),
    model: String(row.model ?? 'gemini-1.5-flash'),
    status: (row.status as AiLog['status']) ?? 'pending',
    promptTokens: row.prompt_tokens ? Number(row.prompt_tokens) : undefined,
    completionTokens: row.completion_tokens ? Number(row.completion_tokens) : undefined,
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    rawTitle: row.raw_title ? String(row.raw_title) : undefined,
    rawSummary: row.raw_summary ? String(row.raw_summary) : undefined,
    processedArticleId: row.processed_article_id ? String(row.processed_article_id) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function serializeAiLog(log: AiLog) {
  return {
    id: log.id,
    source_id: log.sourceId ?? null,
    source_url: log.sourceUrl,
    provider: log.provider,
    model: log.model,
    status: log.status,
    prompt_tokens: log.promptTokens ?? null,
    completion_tokens: log.completionTokens ?? null,
    error_message: log.errorMessage ?? null,
    raw_title: log.rawTitle ?? null,
    raw_summary: log.rawSummary ?? null,
    processed_article_id: log.processedArticleId ?? null,
    created_at: log.createdAt,
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
  if (!id || typeof id !== 'string' || !id.trim()) return false
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
  const [articles, messages, sources, aiLogs] = await Promise.all([
    allArticles(),
    getContactMessages(),
    getAllSources(),
    getAllAiLogs(),
  ])
  const published = articles.filter((a) => a.status === 'published')
  const drafts = articles.filter((a) => a.status === 'draft')
  const breakingNewsCount = published.filter((a) => a.isBreaking).length
  return {
    totalArticles: articles.length,
    publishedArticles: published.length,
    draftArticles: drafts.length,
    breakingNewsCount,
    breakingCount: breakingNewsCount,
    opinionCount: articles.filter((a) => a.isOpinion).length,
    unreadMessages: messages.filter((m) => !m.read).length,
    totalMessages: messages.length,
    totalSources: sources.length,
    activeSources: sources.filter((s) => s.isActive).length,
    totalAiLogs: aiLogs.length,
    failedAiLogs: aiLogs.filter((l) => l.status === 'failed').length,
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
  if (!id || typeof id !== 'string' || !id.trim()) return false
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

// ==============================================================================
// Phase 9: Feed Sources & AI Logs Repository Methods
// ==============================================================================

export async function getAllSources(): Promise<NewsSource[]> {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>('sources?select=*&order=created_at.desc')
    return rows.map(normalizeSource)
  }
  const store = await loadLocalStore()
  return [...(store.sources ?? DEFAULT_SOURCES)].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  )
}

export async function getSourceById(id: string): Promise<NewsSource | null> {
  const sources = await getAllSources()
  return sources.find((s) => s.id === id) ?? null
}

export async function createSource(payload: Omit<NewsSource, 'id' | 'createdAt'>): Promise<NewsSource> {
  const newSource: NewsSource = {
    ...payload,
    id: `src-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  }
  if (getSupabaseConfig()) {
    const [row] = await supabaseRequest<Record<string, unknown>[]>('sources', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(serializeSource(newSource)),
    })
    return normalizeSource(row)
  }
  await mutateLocalStore((store) => {
    store.sources = store.sources ?? [...DEFAULT_SOURCES]
    store.sources.unshift(newSource)
  })
  return newSource
}

export async function updateSource(
  id: string,
  payload: Partial<Omit<NewsSource, 'id' | 'createdAt'>>
): Promise<NewsSource | null> {
  const current = await getSourceById(id)
  if (!current) return null
  const updated: NewsSource = { ...current, ...payload }
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(
      `sources?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(serializeSource(updated)),
      }
    )
    return rows[0] ? normalizeSource(rows[0]) : null
  }
  await mutateLocalStore((store) => {
    store.sources = store.sources ?? [...DEFAULT_SOURCES]
    const idx = store.sources.findIndex((s) => s.id === id)
    if (idx >= 0) store.sources[idx] = updated
  })
  return updated
}

export async function deleteSource(id: string): Promise<boolean> {
  if (!id || typeof id !== 'string' || !id.trim()) return false
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(
      `sources?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      }
    )
    return rows.length > 0
  }
  return mutateLocalStore((store) => {
    store.sources = store.sources ?? [...DEFAULT_SOURCES]
    const initialLen = store.sources.length
    store.sources = store.sources.filter((s) => s.id !== id)
    return store.sources.length < initialLen
  })
}

export async function getAllAiLogs(limit = 50): Promise<AiLog[]> {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(
      `ai_logs?select=*&order=created_at.desc&limit=${limit}`
    )
    return rows.map(normalizeAiLog)
  }
  const store = await loadLocalStore()
  return [...(store.aiLogs ?? [])]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
}

export async function createAiLog(payload: Omit<AiLog, 'id' | 'createdAt'>): Promise<AiLog> {
  const log: AiLog = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  if (getSupabaseConfig()) {
    const [row] = await supabaseRequest<Record<string, unknown>[]>('ai_logs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(serializeAiLog(log)),
    })
    return normalizeAiLog(row)
  }
  await mutateLocalStore((store) => {
    store.aiLogs = store.aiLogs ?? []
    store.aiLogs.unshift(log)
    if (store.aiLogs.length > 200) store.aiLogs = store.aiLogs.slice(0, 200)
  })
  return log
}

export async function updateAiLog(
  id: string,
  payload: Partial<Omit<AiLog, 'id' | 'createdAt'>>
): Promise<AiLog | null> {
  if (getSupabaseConfig()) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(
      `ai_logs?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      }
    )
    return rows[0] ? normalizeAiLog(rows[0]) : null
  }
  return mutateLocalStore((store) => {
    store.aiLogs = store.aiLogs ?? []
    const idx = store.aiLogs.findIndex((l) => l.id === id)
    if (idx >= 0) {
      store.aiLogs[idx] = { ...store.aiLogs[idx], ...payload }
      return store.aiLogs[idx]
    }
    return null
  })
}


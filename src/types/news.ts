// Core news article interface — mirrors the canonical Supabase 'articles' table schema
export interface NewsArticle {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  category: string        // slug key e.g. 'bangladesh'
  categoryLabel: string   // Bengali label e.g. 'বাংলাদেশ'
  sourceName: string
  sourceUrl: string
  imageUrl: string
  publishedAt: string     // ISO date string
  isBreaking: boolean
  status: 'published' | 'draft'
  author?: {
    name: string
    title?: string
    avatarUrl?: string
  }
  division?: string       // e.g. 'dhaka', 'chittagong', 'rajshahi', 'sylhet', etc.
  district?: string       // e.g. 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', etc.
  isVideo?: boolean
  videoDuration?: string
  isOpinion?: boolean
  isPhotoFeature?: boolean
  readingTime?: number    // in minutes
  tags?: string[]
}

// Category definition
export interface Category {
  id: string
  slug: string
  label: string        // Bengali label
  labelEn: string      // English label for routing
}

// Navigation item
export interface NavItem {
  label: string        // Bengali label
  href: string
}

// Contact message interface
export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  isRead?: boolean
  read?: boolean
  createdAt: string
}

// Phase 9: News Feed Source definition
export interface NewsSource {
  id: string
  name: string
  url: string
  feedUrl: string
  category: string
  categoryLabel: string
  isActive: boolean
  fetchIntervalMinutes: number
  lastFetchedAt?: string
  lastStatus?: 'ok' | 'error' | 'pending'
  errorMessage?: string
  createdAt: string
}

// Phase 9: AI Ingestion Log
export interface AiLog {
  id: string
  sourceId?: string
  sourceUrl: string
  provider: string
  model: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  promptTokens?: number
  completionTokens?: number
  errorMessage?: string
  rawTitle?: string
  rawSummary?: string
  processedArticleId?: string
  createdAt: string
}

export type Article = NewsArticle


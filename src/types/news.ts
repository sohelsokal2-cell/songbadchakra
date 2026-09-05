// Core news article interface — mirrors the Supabase 'news' table schema
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

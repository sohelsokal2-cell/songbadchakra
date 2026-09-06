import { type Category, type NavItem } from '@/types/news'

/**
 * Format a date string to Bengali-friendly display format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateBengali = formatDate

/**
 * Format a date string to relative time (e.g. "৩ ঘণ্টা আগে")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'এইমাত্র'
  if (diffMinutes < 60) return `${toBengaliNumber(diffMinutes)} মিনিট আগে`
  if (diffHours < 24) return `${toBengaliNumber(diffHours)} ঘণ্টা আগে`
  if (diffDays < 7) return `${toBengaliNumber(diffDays)} দিন আগে`
  return formatDate(dateString)
}

/**
 * Convert an English number to Bengali numerals
 */
export function toBengaliNumber(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num)
    .split('')
    .map((d) => (bengaliDigits[parseInt(d)] !== undefined ? bengaliDigits[parseInt(d)] : d))
    .join('')
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

/**
 * Get the base URL for the site
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://songbadchakra.com.bd'
}

// ─── Site-wide constants ─────────────────────────────────────────────────────

export const SITE_NAME = 'সংবাদচক্র'
export const SITE_NAME_EN = 'SongbadChakra'
export const SITE_TAGLINE = 'সত্যের পথে, সবার সাথে'
export const SITE_DESCRIPTION =
  'সংবাদচক্র — বাংলাদেশের বিশ্বস্ত বাংলা নিউজ পোর্টাল। সর্বশেষ সংবাদ, রাজনীতি, খেলাধুলা, প্রযুক্তি, বিনোদন ও আরও অনেক কিছু।'
export const SITE_DOMAIN = 'songbadchakra.com.bd'

/**
 * Get formatted today's date in Bengali (e.g. "শনিবার, ৫ সেপ্টেম্বর ২০২৬")
 */
export function getTodayBengaliDate(): string {
  const date = new Date()
  const weekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]
  const dayName = weekdays[date.getDay()]
  const day = toBengaliNumber(date.getDate())
  const month = months[date.getMonth()]
  const year = toBengaliNumber(date.getFullYear())
  return `${dayName}, ${day} ${month} ${year}`
}

/**
 * Bangladesh Divisions for regional news
 */
export const BANGLADESH_DIVISIONS = [
  { id: 'all', label: 'সকল জেলা' },
  { id: 'dhaka', label: 'ঢাকা' },
  { id: 'chittagong', label: 'চট্টগ্রাম' },
  { id: 'rajshahi', label: 'রাজশাহী' },
  { id: 'khulna', label: 'খুলনা' },
  { id: 'barisal', label: 'বরিশাল' },
  { id: 'sylhet', label: 'সিলেট' },
  { id: 'rangpur', label: 'রংপুর' },
  { id: 'mymensingh', label: 'ময়মনসিংহ' },
] as const

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: '1', slug: 'latest',        label: 'সর্বশেষ',       labelEn: 'Latest' },
  { id: '2', slug: 'bangladesh',    label: 'বাংলাদেশ',      labelEn: 'Bangladesh' },
  { id: '3', slug: 'international', label: 'আন্তর্জাতিক',   labelEn: 'International' },
  { id: '4', slug: 'politics',      label: 'রাজনীতি',       labelEn: 'Politics' },
  { id: '5', slug: 'sports',        label: 'খেলাধুলা',      labelEn: 'Sports' },
  { id: '6', slug: 'technology',    label: 'প্রযুক্তি',     labelEn: 'Technology' },
  { id: '7', slug: 'business',      label: 'ব্যবসা',        labelEn: 'Business' },
  { id: '8', slug: 'entertainment', label: 'বিনোদন',        labelEn: 'Entertainment' },
  { id: '9', slug: 'science',       label: 'বিজ্ঞান',       labelEn: 'Science' },
  { id: '10', slug: 'lifestyle',    label: 'লাইফস্টাইল',   labelEn: 'Lifestyle' },
  { id: '11', slug: 'opinion',      label: 'মতামত',         labelEn: 'Opinion' },
  { id: '12', slug: 'video',        label: 'ভিডিও',         labelEn: 'Video' },
]

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug)

// ─── Navigation ──────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: 'সর্বশেষ',       href: '/latest' },
  { label: 'বাংলাদেশ',      href: '/bangladesh' },
  { label: 'আন্তর্জাতিক',   href: '/international' },
  { label: 'রাজনীতি',       href: '/politics' },
  { label: 'খেলাধুলা',      href: '/sports' },
  { label: 'প্রযুক্তি',     href: '/technology' },
  { label: 'ব্যবসা',        href: '/business' },
  { label: 'বিনোদন',        href: '/entertainment' },
  { label: 'বিজ্ঞান',       href: '/science' },
  { label: 'লাইফস্টাইল',   href: '/lifestyle' },
  { label: 'মতামত',         href: '/opinion' },
  { label: 'ভিডিও',         href: '/video' },
]

/**
 * Validate that an image URL is a safe HTTPS URL or a local absolute path (/images/...)
 * Prevents SSRF to internal network, cloud metadata endpoints, and script schemes.
 */
export function isAllowedImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  const trimmed = value.trim()
  // Local static paths e.g. /images/... or /logo.png
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    // Deny internal and metadata hosts
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.')
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

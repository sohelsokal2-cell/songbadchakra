import type { Metadata } from 'next'
import Link from 'next/link'
import { searchNews } from '@/data/mockNews'
import NewsCard from '@/components/news/NewsCard'
import LatestNews from '@/components/news/LatestNews'
import PopularNews from '@/components/news/PopularNews'
import SearchBar from '@/components/ui/SearchBar'
import EmptyState from '@/components/ui/EmptyState'
import AdvertisementPlaceholder from '@/components/ui/AdvertisementPlaceholder'
import { toBengaliNumber } from '@/lib/utils'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim() || ''

  return {
    title: query ? `"${query}" এর অনুসন্ধান ফলাফল` : 'সংবাদ অনুসন্ধান',
    description: 'সংবাদচক্রের সকল সাম্প্রতিক ও আর্কাইভে সংরক্ষিত সংবাদ অনুসন্ধান করুন।',
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() || ''
  const results = query ? searchNews(query) : []

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-4 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">অনুসন্ধান</span>
      </nav>

      <div className="max-w-3xl mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-bengali text-[var(--color-text-primary)] mb-4">
          সংবাদ অনুসন্ধান
        </h1>
        <SearchBar defaultValue={query} autoFocus className="mb-3" />
        {query && (
          <p className="text-sm text-[var(--color-text-muted)]">
            &ldquo;<span className="font-semibold text-[var(--color-text-primary)]">{query}</span>&rdquo; সম্পর্কিত ফলাফল পাওয়া গেছে:{' '}
            <span className="font-bold text-[var(--color-brand-primary)]">{toBengaliNumber(results.length)}</span> টি
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {!query ? (
            <div className="bg-white rounded-xl p-8 border border-[var(--color-border)] text-center">
              <div className="w-16 h-16 bg-red-50 text-[var(--color-brand-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold font-bengali text-[var(--color-text-primary)] mb-2">
                সংবাদ বা বিষয়বস্তু লিখে খুঁজুন
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                উপরে অনুসন্ধান বক্সে যেকোনো শব্দ লিখে খুঁজুন। যেমন: বাংলাদেশ, বাজেট, খেলাধুলা, জলবায়ু ইত্যাদি।
              </p>
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title={`"${query}" সম্পর্কিত কোনো সংবাদ পাওয়া যায়নি`}
              description="শব্দের বানান সঠিক আছে কিনা পরীক্ষা করুন অথবা অন্য কোনো কীওয়ার্ড দিয়ে অনুসন্ধান করুন।"
            />
          ) : (
            <div className="space-y-4">
              {results.map((article) => (
                <NewsCard key={article.id} article={article} variant="horizontal" />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="space-y-8">
          <AdvertisementPlaceholder size="rectangle" label="বিজ্ঞাপন" />

          {/* Popular News */}
          <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] shadow-xs">
            <h2 className="text-base font-bold font-bengali mb-4 flex items-center gap-2 text-[var(--color-text-primary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-secondary)] inline-block" />
              সর্বাধিক পঠিত
            </h2>
            <PopularNews limit={5} />
          </div>

          <AdvertisementPlaceholder size="square" label="বিজ্ঞাপন" />

          {/* Latest News */}
          <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] shadow-xs">
            <h2 className="text-base font-bold font-bengali mb-4 flex items-center gap-2 text-[var(--color-text-primary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-primary)] inline-block" />
              তাজা সংবাদ
            </h2>
            <LatestNews limit={5} />
          </div>
        </aside>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { listPublishedArticles } from '@/lib/public-news-repository'
import AdvertisementPlaceholder from '@/components/ui/AdvertisementPlaceholder'
import { formatRelativeTime, toBengaliNumber, SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'সর্বাধিক পঠিত সংবাদ',
  description: `${SITE_NAME}-এ পাঠকের পছন্দের শীর্ষ এবং সবচেয়ে বেশি পঠিত সংবাদসমূহের সংকলন।`,
  alternates: {
    canonical: `https://${SITE_DOMAIN}/popular`,
  },
}

export const dynamic = 'force-dynamic'

export default async function PopularNewsPage() {
  const allArticles = await listPublishedArticles()
  const popularNews = allArticles.slice(5, 17)
  const latestSidebar = allArticles.slice(0, 6)

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 text-xs text-[var(--color-text-muted)] flex items-center gap-2 font-bengali">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">সর্বাধিক পঠিত</span>
      </nav>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--color-border)] pb-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-7 bg-[var(--color-brand-primary)] rounded-xs inline-block" />
          <h1 className="text-2xl md:text-3xl font-bold font-bengali text-[var(--color-text-primary)]">
            সর্বাধিক পঠিত সংবাদ
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] font-bengali mt-1 ml-6">
          পাঠকের আগ্রহের শীর্ষে থাকা আজকের সবচেয়ে আলোচিত খবরগুলো
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ── Main List with Ranked Numbers ───────────────────────────────── */}
        <div className="space-y-4">
          {popularNews.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-[var(--color-border)] text-center text-slate-500 font-bengali">
              বর্তমানে কোনো পঠিত সংবাদ তালিকাভুক্ত নেই।
            </div>
          ) : (
            popularNews.map((article, index) => (
              <article
                key={article.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-[var(--color-border)] hover:border-red-200 transition-all shadow-xs flex flex-col sm:flex-row items-start gap-4 group"
              >
                {/* Rank Badge */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 text-[var(--color-brand-primary)] font-bold text-lg flex items-center justify-center font-bengali border border-red-100 group-hover:bg-[var(--color-brand-primary)] group-hover:text-white transition-colors">
                  {toBengaliNumber(index + 1)}
                </div>

                {/* Thumbnail */}
                <div className="relative w-full sm:w-36 aspect-[16/10] shrink-0 rounded-lg overflow-hidden bg-slate-100">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 144px"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bengali">
                    {article.categoryLabel}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link href={`/news/${article.slug}`}>
                    <h2 className="text-base sm:text-lg font-bold font-bengali text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-2 leading-snug mb-2">
                      {article.title}
                    </h2>
                  </Link>

                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-bengali line-clamp-2 leading-relaxed mb-3">
                    {article.summary}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] font-bengali">
                    <span className="text-[var(--color-brand-primary)] font-medium">
                      {article.sourceName}
                    </span>
                    <span>•</span>
                    <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-xs">
            <h3 className="text-base font-bold font-bengali text-[var(--color-text-primary)] border-b pb-2 mb-4">
              তাজা সংবাদ
            </h3>
            <div className="space-y-3">
              {latestSidebar.length === 0 ? (
                <p className="text-xs text-slate-400 font-bengali">কোনো সংবাদ নেই</p>
              ) : (
                latestSidebar.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="block group"
                  >
                    <h4 className="text-xs font-semibold font-bengali text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-bengali">
                      {formatRelativeTime(article.publishedAt)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <AdvertisementPlaceholder size="square" label="বিজ্ঞাপন" />
        </aside>
      </div>
    </div>
  )
}

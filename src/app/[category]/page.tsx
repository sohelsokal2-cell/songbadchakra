import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES, getCategoryBySlug, SITE_NAME, SITE_DOMAIN } from '@/lib/utils'
import { listPublishedArticles } from '@/lib/public-news-repository'
import NewsCard from '@/components/news/NewsCard'
import FeaturedNewsCard from '@/components/news/FeaturedNewsCard'
import LatestNews from '@/components/news/LatestNews'
import PopularNews from '@/components/news/PopularNews'
import EmptyState from '@/components/ui/EmptyState'
import AdvertisementPlaceholder from '@/components/ui/AdvertisementPlaceholder'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.slug,
  }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params
  const cat = getCategoryBySlug(slug)

  if (!cat) return {}

  const title = `${cat.label} সংবাদ`
  const description = `সংবাদচক্র-এ ${cat.label} বিভাগের সর্বশেষ তাজা খবর, বিশেষ প্রতিবেদন এবং বিশ্লেষণ পড়ুন।`

  return {
    title,
    description,
    alternates: {
      canonical: `https://${SITE_DOMAIN}/${cat.slug}`,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `https://${SITE_DOMAIN}/${cat.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params
  const cat = getCategoryBySlug(slug)

  if (!cat) {
    notFound()
  }

  // If latest category, get all sorted by latest date, otherwise filter by category
  const allArticles = await listPublishedArticles()
  const articles = slug === 'latest'
    ? allArticles.slice(0, 30)
    : allArticles.filter((article) => article.category === slug)
  const latestArticles = allArticles.slice(0, 5)
  const popularArticles = allArticles.slice(5, 10)
  const [heroArticle, ...restArticles] = articles

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb & Category Header ─────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-4 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">{cat.label}</span>
      </nav>

      <div className="flex items-center justify-between border-b-2 border-[var(--color-brand-primary)] pb-3 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-3 h-7 bg-[var(--color-brand-primary)] rounded-full inline-block" />
          <h1 className="text-2xl md:text-3xl font-bold font-bengali text-[var(--color-text-primary)]">
            {cat.label}
          </h1>
        </div>
        <span className="text-xs md:text-sm text-[var(--color-text-muted)]">
          মোট সংবাদ: {articles.length} টি
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ── Articles List / Grid ────────────────────────────────────────── */}
        <div>
          {articles.length === 0 ? (
            <EmptyState
              title={`এই বিভাগে কোনো সংবাদ নেই`}
              description="শীঘ্রই এই বিভাগে নতুন সংবাদ আপডেট করা হবে। সাথে থাকুন।"
            />
          ) : (
            <div className="space-y-8">
              {/* Highlight Hero Article */}
              {heroArticle && (
                <div className="mb-8">
                  <FeaturedNewsCard article={heroArticle} priority />
                </div>
              )}

              {/* Grid of Remaining Articles */}
              {restArticles.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold font-bengali mb-4 text-[var(--color-text-primary)] border-b pb-2">
                    আরও সংবাদ
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {restArticles.map((article) => (
                      <NewsCard key={article.id} article={article} variant="default" />
                    ))}
                  </div>
                </div>
              )}
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
            <PopularNews limit={5} articles={popularArticles} />
          </div>

          <AdvertisementPlaceholder size="square" label="বিজ্ঞাপন" />

          {/* Latest News */}
          <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] shadow-xs">
            <h2 className="text-base font-bold font-bengali mb-4 flex items-center gap-2 text-[var(--color-text-primary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-primary)] inline-block" />
              তাজা সংবাদ
            </h2>
            <LatestNews limit={5} articles={latestArticles} />
          </div>
        </aside>
      </div>
    </div>
  )
}

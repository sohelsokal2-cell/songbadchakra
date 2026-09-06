import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { listPublishedArticles, getPublishedArticleBySlug } from '@/lib/public-news-repository'
import NewsCard from '@/components/news/NewsCard'
import ArticleActions from '@/components/news/ArticleActions'
import TabbedNewsWidget from '@/components/news/TabbedNewsWidget'
import AdvertisementPlaceholder from '@/components/ui/AdvertisementPlaceholder'
import { formatDate, formatRelativeTime, SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const articles = await listPublishedArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  if (!article) return {}

  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `https://${SITE_DOMAIN}/news/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary,
      url: `https://${SITE_DOMAIN}/news/${article.slug}`,
      images: [{ url: article.imageUrl, width: 800, height: 450, alt: article.title }],
      publishedTime: article.publishedAt,
      section: article.categoryLabel,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)
  if (!article) notFound()

  const allArticles = await listPublishedArticles()
  const related = allArticles.filter((candidate) => candidate.id !== article.id && candidate.category === article.category).slice(0, 3)
  const latestList = allArticles.slice(0, 8)
  const popularList = allArticles.slice(5, 13)
  const fullArticleUrl = `https://${SITE_DOMAIN}/news/${article.slug}`

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: [article.imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'নিজস্ব প্রতিবেদক',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `https://${SITE_DOMAIN}`,
      logo: {
        '@type': 'ImageObject',
        url: `https://${SITE_DOMAIN}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullArticleUrl,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'হোম',
        item: `https://${SITE_DOMAIN}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.categoryLabel,
        item: `https://${SITE_DOMAIN}/${article.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: fullArticleUrl,
      },
    ],
  }

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── JSON-LD Structured Data ────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8">
        {/* ── Article Main Column ────────────────────────────────────────── */}
        <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 shadow-xs">
          {/* Breadcrumb */}
          <nav aria-label="পথের ধাপ" className="mb-4 text-xs text-[var(--color-text-muted)]">
            <ol className="flex items-center gap-1.5 flex-wrap">
              <li>
                <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">হোম</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/${article.category}`} className="hover:text-[var(--color-brand-primary)] transition-colors font-medium">
                  {article.categoryLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-primary)] truncate max-w-[240px]" aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>

          {/* Category Tag */}
          <Link
            href={`/${article.category}`}
            className="inline-block text-[var(--color-brand-primary)] bg-red-50 hover:bg-red-100 font-bold text-xs px-3 py-1 rounded-full mb-3 transition-colors font-bengali"
          >
            {article.categoryLabel}
          </Link>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-bengali text-[var(--color-text-primary)] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Byline & Timestamps (Prothom Alo Style) */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[var(--color-text-muted)] pb-4 border-b border-[var(--color-border)] font-bengali gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-text-primary)]">
                {article.author?.name || 'নিজস্ব প্রতিবেদক'}
              </span>
              <span>•</span>
              <span>{article.sourceName}</span>
            </div>
            <div className="flex items-center gap-3">
              <time dateTime={article.publishedAt}>
                প্রকাশ: {formatDate(article.publishedAt)}
              </time>
              <span>({formatRelativeTime(article.publishedAt)})</span>
            </div>
          </div>

          {/* Interactive Actions Bar: Audio, Font Resize, Bookmark, Social Sharing */}
          <ArticleActions
            title={article.title}
            url={fullArticleUrl}
            content={article.content}
            articleId={article.id}
          />

          {/* Summary Callout */}
          <div className="text-base md:text-lg text-[var(--color-text-secondary)] font-bengali leading-relaxed mb-6 border-l-4 border-[var(--color-brand-primary)] pl-4 py-2 bg-red-50/50 rounded-r-xl">
            {article.summary}
          </div>

          {/* Featured Image with Caption */}
          <figure className="mb-6 rounded-xl overflow-hidden aspect-[16/9] relative shadow-xs">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 75vw"
              priority
            />
          </figure>
          <p className="text-xs text-[var(--color-text-muted)] text-center font-bengali -mt-4 mb-6 italic">
            ছবি: {article.sourceName} আর্কাইভ
          </p>

          {/* Article Prose Content */}
          <div className="article-content text-[var(--color-text-secondary)] leading-loose space-y-4 mb-8 font-bengali text-base md:text-[17px]">
            {article.content.split('\n\n').map((para, idx) => (
              <p key={idx} className="leading-relaxed">
                {para.trim()}
              </p>
            ))}
          </div>

          {/* Source Attribution */}
          {article.sourceUrl !== '#' && (
            <div className="mb-8 p-3 bg-gray-50 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-bengali flex items-center justify-between">
              <span>মূল প্রতিবেদন ও সূত্র: <strong className="text-[var(--color-text-primary)]">{article.sourceName}</strong></span>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-[var(--color-brand-primary)] hover:underline font-bold"
              >
                উৎস দেখুন ↗
              </a>
            </div>
          )}

          {/* Bottom Sharing Bar */}
          <ArticleActions title={article.title} url={fullArticleUrl} />

          {/* Related News (Prothom Alo Style) */}
          {related.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2.5 h-6 bg-[var(--color-brand-primary)] rounded-full inline-block" />
                <h2 id="related-heading" className="text-xl font-bold font-bengali text-[var(--color-text-primary)]">
                  সম্পর্কিত আরও সংবাদ
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((rel) => (
                  <NewsCard key={rel.id} article={rel} variant="default" />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="space-y-6">
          <AdvertisementPlaceholder size="rectangle" label="বিজ্ঞাপন" />

          {/* Prothom Alo Tabbed Widget (Latest vs Popular) */}
          <TabbedNewsWidget latestNews={latestList} popularNews={popularList} />

          <AdvertisementPlaceholder size="square" label="বিজ্ঞাপন" />
        </aside>
      </div>
    </div>
  )
}

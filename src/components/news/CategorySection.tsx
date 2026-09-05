import Link from 'next/link'
import { type NewsArticle } from '@/types/news'
import NewsCard from './NewsCard'

interface CategorySectionProps {
  title: string
  categorySlug: string
  articles: NewsArticle[]
  viewAllHref?: string
  columns?: 2 | 3 | 4
}

const colClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export default function CategorySection({
  title,
  categorySlug,
  articles,
  viewAllHref,
  columns = 3,
}: CategorySectionProps) {
  if (articles.length === 0) return null

  return (
    <section aria-labelledby={`section-${categorySlug}`} className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-7 rounded-full cat-${categorySlug}`} aria-hidden="true" />
          <h2
            id={`section-${categorySlug}`}
            className="text-xl font-bold text-[var(--color-secondary)]"
          >
            {title}
          </h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition-colors flex items-center gap-1"
          >
            সব দেখুন
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* News grid */}
      <div className={`grid ${colClasses[columns]} gap-5`}>
        {articles.slice(0, columns).map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}

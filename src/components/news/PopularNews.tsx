import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/types/news'
import { formatRelativeTime, toBengaliNumber } from '@/lib/utils'

interface PopularNewsProps {
  limit?: number
}

export default function PopularNews({ limit = 5, articles = [] }: PopularNewsProps & { articles?: NewsArticle[] }) {
  const visibleArticles = articles.slice(0, limit)

  return (
    <aside aria-labelledby="sidebar-popular">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
        <h2 id="sidebar-popular" className="text-base font-bold text-[var(--color-secondary)]">
          জনপ্রিয় খবর
        </h2>
      </div>
      <ol className="space-y-3">
        {visibleArticles.map((article, idx) => (
          <li key={article.id} className="group flex gap-3 items-start">
            {/* Number badge */}
            <span
              aria-label={`${idx + 1} নম্বর`}
              className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:border-[var(--color-primary)] transition-colors"
            >
              {toBengaliNumber(idx + 1)}
            </span>
            {/* Thumbnail */}
            <Link href={`/news/${article.slug}`} className="shrink-0 relative w-16 h-12 rounded-md overflow-hidden block" tabIndex={-1} aria-hidden="true">
              <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="64px" />
            </Link>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-[var(--color-secondary)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                <Link href={`/news/${article.slug}`}>{article.title}</Link>
              </h3>
              <time dateTime={article.publishedAt} className="text-[10px] text-[var(--color-muted)] mt-0.5 block">
                {formatRelativeTime(article.publishedAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}

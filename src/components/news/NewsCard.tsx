import Link from 'next/link'
import Image from 'next/image'
import { type NewsArticle } from '@/types/news'
import { formatRelativeTime } from '@/lib/utils'

interface NewsCardProps {
  article: NewsArticle
  variant?: 'default' | 'compact' | 'horizontal'
  className?: string
  priority?: boolean
}

export default function NewsCard({
  article,
  variant = 'default',
  className = '',
  priority = false,
}: NewsCardProps) {
  if (variant === 'horizontal') {
    return (
      <article className={`news-card group flex gap-3 bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-card)] ${className}`}>
        <Link
          href={`/news/${article.slug}`}
          className="shrink-0 block w-24 h-20 sm:w-28 sm:h-24 relative overflow-hidden"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 96px, 112px"
          />
        </Link>
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <CategoryBadge category={article.category} label={article.categoryLabel} />
            <h3 className="text-sm font-semibold text-[var(--color-secondary)] leading-snug mt-1 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
              <Link href={`/news/${article.slug}`}>{article.title}</Link>
            </h3>
          </div>
          <time
            dateTime={article.publishedAt}
            className="text-xs text-[var(--color-muted)] mt-1"
          >
            {formatRelativeTime(article.publishedAt)}
          </time>
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className={`news-card group flex gap-2 py-2 border-b border-[var(--color-border)] last:border-0 ${className}`}>
        <Link href={`/news/${article.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0 w-16 h-14 relative overflow-hidden rounded-md block">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-[var(--color-secondary)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            <Link href={`/news/${article.slug}`}>{article.title}</Link>
          </h3>
          <time dateTime={article.publishedAt} className="text-[10px] text-[var(--color-muted)] mt-0.5 block">
            {formatRelativeTime(article.publishedAt)}
          </time>
        </div>
      </article>
    )
  }

  // Default card
  return (
    <article className={`news-card group bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-card)] flex flex-col ${className}`}>
      {/* Image */}
      <Link href={`/news/${article.slug}`} className="block relative overflow-hidden h-48" tabIndex={-1} aria-hidden="true">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
        {article.isBreaking && (
          <span className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            ব্রেকিং
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <CategoryBadge category={article.category} label={article.categoryLabel} />

        <h3 className="mt-2 text-base font-bold text-[var(--color-secondary)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors flex-1">
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h3>

        <p className="mt-2 text-sm text-[var(--color-muted)] line-clamp-2 leading-relaxed">
          {article.summary}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <time dateTime={article.publishedAt} className="text-xs text-[var(--color-muted)]">
            {formatRelativeTime(article.publishedAt)}
          </time>
          <span className="text-xs text-[var(--color-muted)] truncate max-w-[100px]">
            {article.sourceName}
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Internal helper ────────────────────────────────────────────────────────────
export function CategoryBadge({ category, label }: { category: string; label: string }) {
  return (
    <span
      className={`inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider cat-${category}`}
    >
      {label}
    </span>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { type NewsArticle } from '@/types/news'
import { formatRelativeTime } from '@/lib/utils'
import { CategoryBadge } from './NewsCard'

interface FeaturedNewsCardProps {
  article: NewsArticle
  className?: string
  priority?: boolean
}

export default function FeaturedNewsCard({
  article,
  className = '',
  priority = false,
}: FeaturedNewsCardProps) {
  return (
    <article
      className={`group relative w-full overflow-hidden rounded-2xl shadow-lg min-h-[420px] lg:min-h-[500px] flex flex-col justify-end ${className}`}
    >
      {/* Background image */}
      <Link href={`/news/${article.slug}`} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 60vw"
          priority={priority}
        />
      </Link>

      {/* Gradient overlay */}
      <div className="absolute inset-0 img-overlay pointer-events-none" />

      {/* Breaking badge */}
      {article.isBreaking && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-widest animate-pulse">
            ব্রেকিং
          </span>
        </div>
      )}

      {/* Content overlay */}
      <div className="relative z-10 p-5 sm:p-7">
        <CategoryBadge category={article.category} label={article.categoryLabel} />

        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight group-hover:text-red-100 transition-colors">
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h2>

        <p className="mt-2 text-white/80 text-sm sm:text-base line-clamp-2 leading-relaxed">
          {article.summary}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <time dateTime={article.publishedAt}>
              {formatRelativeTime(article.publishedAt)}
            </time>
            <span>•</span>
            <span>{article.sourceName}</span>
          </div>
          <Link
            href={`/news/${article.slug}`}
            className="text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            বিস্তারিত পড়ুন →
          </Link>
        </div>
      </div>
    </article>
  )
}

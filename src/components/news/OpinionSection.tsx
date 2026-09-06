import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/types/news'

export default function OpinionSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null

  const opinions = articles

  return (
    <section className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-2xl border border-amber-200/70 p-6 mb-10 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-amber-200/60 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-7 bg-amber-600 rounded-full inline-block" />
          <h2 className="text-xl md:text-2xl font-bold font-bengali text-[var(--color-text-primary)]">
            মতামত ও সম্পাদকীয়
          </h2>
        </div>
        <span className="text-xs font-bold text-amber-700 font-bengali">
          বিশেষ কলামিস্ট
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {opinions.map((op) => (
          <article
            key={op.id}
            className="bg-white rounded-xl p-5 border border-amber-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Author badge */}
              {op.author && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
                    <Image
                      src={op.author.avatarUrl || op.imageUrl}
                      alt={op.author.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-bengali text-[var(--color-text-primary)]">
                      {op.author.name}
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-muted)] font-bengali">
                      {op.author.title}
                    </p>
                  </div>
                </div>
              )}

              {/* Title with quote mark */}
              <Link href={`/news/${op.slug}`}>
                <h4 className="text-base font-bold font-bengali text-[var(--color-text-primary)] hover:text-amber-700 transition-colors leading-snug mb-3">
                  &ldquo;{op.title}&rdquo;
                </h4>
              </Link>

              <p className="text-xs text-[var(--color-text-secondary)] font-bengali line-clamp-3 leading-relaxed">
                {op.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-right">
              <Link
                href={`/news/${op.slug}`}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 font-bengali"
              >
                পুরো কলাম পড়ুন →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

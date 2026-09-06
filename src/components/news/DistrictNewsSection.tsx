'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BANGLADESH_DIVISIONS, formatRelativeTime } from '@/lib/utils'
import type { NewsArticle } from '@/types/news'

export default function DistrictNewsSection({ articles }: { articles: NewsArticle[] }) {
  const [selectedDivision, setSelectedDivision] = useState<string>('all')

  const filteredArticles = selectedDivision === 'all'
    ? articles.slice(0, 6)
    : articles.filter((article) => article.division === selectedDivision).slice(0, 6)

  return (
    <section className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-10 shadow-xs">
      {/* ── Section Header & Division Filter ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-6">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-7 bg-emerald-600 rounded-full inline-block" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-bengali text-[var(--color-text-primary)]">
              সারাদেশের খবর
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] font-bengali">
              বিভাগ ও জেলাভিত্তিক সর্বশেষ আঞ্চলিক সংবাদ
            </p>
          </div>
        </div>

        {/* Division Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {BANGLADESH_DIVISIONS.map((div) => (
            <button
              key={div.id}
              type="button"
              onClick={() => setSelectedDivision(div.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-bengali shrink-0 transition-colors cursor-pointer ${
                selectedDivision === div.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-[var(--color-text-secondary)] hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {div.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── News Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <article key={article.id} className="group flex gap-4 items-start">
            <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="112px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/news/${article.slug}`}>
                <h3 className="text-sm font-bold font-bengali text-[var(--color-text-primary)] group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-1.5">
                  {article.title}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] font-bengali">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  {article.categoryLabel}
                </span>
                <span>•</span>
                <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-right">
        <Link
          href="/bangladesh"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 font-bengali inline-flex items-center gap-1"
        >
          সব জেলার সংবাদ দেখুন →
        </Link>
      </div>
    </section>
  )
}

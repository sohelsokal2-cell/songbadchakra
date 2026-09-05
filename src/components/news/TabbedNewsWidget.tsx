'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { type NewsArticle } from '@/types/news'
import { formatRelativeTime, toBengaliNumber } from '@/lib/utils'

interface TabbedNewsWidgetProps {
  latestNews: NewsArticle[]
  popularNews: NewsArticle[]
}

export default function TabbedNewsWidget({ latestNews, popularNews }: TabbedNewsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest')

  const currentList = activeTab === 'latest' ? latestNews.slice(0, 6) : popularNews.slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
      {/* ── Tab Switcher Header (Prothom Alo Style) ───────────────────────── */}
      <div className="flex border-b border-[var(--color-border)] bg-gray-50/70">
        <button
          type="button"
          onClick={() => setActiveTab('latest')}
          className={`flex-1 py-3 text-center text-sm font-bold font-bengali transition-colors relative cursor-pointer ${
            activeTab === 'latest'
              ? 'text-[var(--color-brand-primary)] bg-white border-t-2 border-t-[var(--color-brand-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          সর্বশেষ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('popular')}
          className={`flex-1 py-3 text-center text-sm font-bold font-bengali transition-colors relative cursor-pointer ${
            activeTab === 'popular'
              ? 'text-[var(--color-brand-primary)] bg-white border-t-2 border-t-[var(--color-brand-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          সর্বাধিক পঠিত
        </button>
      </div>

      {/* ── News List ────────────────────────────────────────────────────── */}
      <div className="divide-y divide-[var(--color-border)] p-2">
        {currentList.map((article, idx) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group flex items-start gap-3 p-2.5 hover:bg-red-50/40 rounded-lg transition-colors"
          >
            {/* Number badge for popular or red dot for latest */}
            {activeTab === 'popular' ? (
              <span className="w-6 h-6 shrink-0 rounded-full bg-slate-100 group-hover:bg-[var(--color-brand-primary)] group-hover:text-white text-[var(--color-secondary)] font-bold text-xs flex items-center justify-center font-bengali transition-colors">
                {toBengaliNumber(idx + 1)}
              </span>
            ) : (
              <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--color-brand-primary)] mt-2" />
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold font-bengali text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-2 leading-snug mb-1">
                {article.title}
              </h4>
              <span className="text-[11px] text-[var(--color-text-muted)] font-bengali flex items-center gap-1">
                <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
              </span>
            </div>

            {/* Thumbnail for top 2 popular items */}
            {activeTab === 'popular' && idx < 2 && (
              <div className="w-14 h-14 shrink-0 relative rounded-md overflow-hidden">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="56px"
                />
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="p-2 border-t border-[var(--color-border)] text-center bg-gray-50/50">
        <Link
          href={activeTab === 'latest' ? '/latest' : '/popular'}
          className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline font-bengali inline-flex items-center gap-1"
        >
          {activeTab === 'latest' ? 'সব তাজা খবর দেখুন' : 'সব পঠিত খবর দেখুন'} →
        </Link>
      </div>
    </div>
  )
}

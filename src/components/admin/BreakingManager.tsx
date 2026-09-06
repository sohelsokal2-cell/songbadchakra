'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Article } from '@/types/news'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'

interface BreakingManagerProps {
  initialArticles: Article[]
}

export default function BreakingManager({ initialArticles }: BreakingManagerProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const breakingArticles = articles.filter((a) => a.isBreaking)
  const nonBreakingArticles = articles.filter((a) => !a.isBreaking)

  const handleToggle = async (id: string, currentVal: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBreaking: !currentVal }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isBreaking: !currentVal } : a))
        )
      } else {
        alert(data.error || 'ব্রেকিং স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে')
      }
    } catch {
      alert('সার্ভার যোগাযোগ ত্রুটি')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-8 font-bengali">
      {/* ── Active Breaking News Live Preview Ticker ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <h2 className="text-base font-bold text-slate-800">
              লাইভ ব্রেকিং টিকার প্রিভিউ
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
            {toBengaliNumber(breakingArticles.length)} টি সক্রিয়
          </span>
        </div>

        {breakingArticles.length > 0 ? (
          <div className="bg-red-600 text-white rounded-lg p-3 flex items-center gap-3 overflow-hidden shadow-sm">
            <span className="bg-white text-red-600 text-xs font-black px-2.5 py-1 rounded uppercase tracking-wider shrink-0">
              ব্রেকিং নিউজ
            </span>
            <div className="text-xs sm:text-sm font-semibold truncate">
              {breakingArticles.map((a) => a.title).join('  ///  ')}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 text-center">
            বর্তমানে কোনো ব্রেকিং নিউজ সক্রিয় নেই। নিচের তালিকা থেকে যেকোনো সংবাদের পাশে &ldquo;ব্রেকিং চালু করুন&rdquo; চাপুন।
          </div>
        )}
      </div>

      {/* ── Currently Active Breaking News Section ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-red-50/40">
          <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
            <span>🚨</span>
            <span>বর্তমানে সক্রিয় ব্রেকিং নিউজ ({toBengaliNumber(breakingArticles.length)})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            এই সংবাদগুলো পোর্টালের শীর্ষ ব্যানারে এবং ব্রেকিং নিউজ স্ক্রলবারে প্রদর্শিত হচ্ছে
          </p>
        </div>

        {breakingArticles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            কোনো সক্রিয় ব্রেকিং সংবাদ নেই।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {breakingArticles.map((article) => {
              const isTog = togglingId === article.id
              return (
                <div key={article.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold border border-red-200">
                        {article.category}
                      </span>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="font-bold text-sm text-slate-800 hover:text-red-600 line-clamp-1"
                      >
                        {article.title}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {article.summary}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      প্রকাশ: {formatDateBengali(article.publishedAt)} • লেখক: {article.author?.name || 'সম্পাদকীয় ডেস্ক'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/news/${article.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      ভিউ ↗
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggle(article.id, true)}
                      disabled={isTog}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-all border border-rose-200"
                    >
                      {isTog ? 'অফ করা হচ্ছে...' : 'বন্ধ করুন ✕'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Promote Other Articles to Breaking ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            অন্যান্য সংবাদ ব্রেকিংয়ে যুক্ত করুন
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            যেকোনো সাম্প্রতিক সংবাদ এক ক্লিকে ব্রেকিং নিউজে প্রমোট করুন
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {nonBreakingArticles.slice(0, 15).map((article) => {
            const isTog = togglingId === article.id
            return (
              <div key={article.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                      {article.category}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">
                      {article.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    প্রকাশ: {formatDateBengali(article.publishedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(article.id, false)}
                    disabled={isTog}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    {isTog ? 'যুক্ত হচ্ছে...' : '🚨 ব্রেকিং চালু করুন'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

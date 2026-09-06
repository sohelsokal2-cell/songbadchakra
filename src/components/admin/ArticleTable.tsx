'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Article } from '@/types/news'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'

interface ArticleTableProps {
  initialArticles: Article[]
}

export default function ArticleTable({ initialArticles }: ArticleTableProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Unique categories for filter dropdown
  const categories = Array.from(new Set(initialArticles.map((a) => a.category)))

  // Filtered articles
  const filtered = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Toggle Breaking News
  const handleToggleBreaking = async (id: string, currentVal?: boolean) => {
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

  // Delete Article
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" সংবাদটি ডিলিট করতে চান?`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id))
      } else {
        alert(data.error || 'সংবাদ ডিলিট ব্যর্থ হয়েছে')
      }
    } catch {
      alert('সার্ভার যোগাযোগ ত্রুটি')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4 font-bengali">
      {/* ── Search & Filter Controls ──────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিরোনাম, সারসংক্ষেপ বা লেখক দিয়ে খুঁজুন..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <option value="all">সকল বিভাগ ({toBengaliNumber(articles.length)})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({toBengaliNumber(articles.filter((a) => a.category === cat).length)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Articles List Table ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">সংবাদ শিরোনাম ও বিবরণ</th>
                <th className="py-3 px-3">বিভাগ</th>
                <th className="py-3 px-3">তারিখ ও পাঠ</th>
                <th className="py-3 px-3 text-center">ব্রেকিং নিউজ?</th>
                <th className="py-3 px-4 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    কোনো সংবাদ খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((article) => {
                  const isDel = deletingId === article.id
                  const isTog = togglingId === article.id

                  return (
                    <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="font-bold text-slate-800 hover:text-red-600 transition-colors line-clamp-1"
                          >
                            {article.title}
                          </Link>
                          {article.isOpinion && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                              মতামত
                            </span>
                          )}
                          {article.isVideo && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-semibold border border-rose-200">
                              ভিডিও
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {article.summary}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {article.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        <div>{formatDateBengali(article.publishedAt)}</div>
                        <div className="text-slate-400">
                          লেখক: {article.author?.name || 'সম্পাদকীয় ডেস্ক'} • {toBengaliNumber(article.readingTime || 3)} মি.
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleBreaking(article.id, article.isBreaking)}
                          disabled={isTog}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            article.isBreaking
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {isTog ? '...' : article.isBreaking ? '🚨 ব্রেকিং চালু' : 'বন্ধ'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold text-[11px] transition-colors border border-slate-200"
                        >
                          সম্পাদনা
                        </Link>
                        <Link
                          href={`/news/${article.slug}`}
                          target="_blank"
                          className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition-colors border border-slate-200"
                        >
                          ভিউ ↗
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={isDel}
                          className="inline-block px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[11px] transition-colors border border-rose-200"
                        >
                          {isDel ? 'মুছছে...' : 'মুছুন'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-right text-xs text-slate-500">
          মোট প্রদর্শিত: {toBengaliNumber(filtered.length)} / {toBengaliNumber(articles.length)} টি সংবাদ
        </div>
      </div>
    </div>
  )
}

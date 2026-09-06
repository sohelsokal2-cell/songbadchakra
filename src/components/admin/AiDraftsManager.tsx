'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type NewsArticle, type AiLog } from '@/types/news'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'

interface AiDraftsManagerProps {
  initialDrafts: NewsArticle[]
  initialLogs: AiLog[]
}

export default function AiDraftsManager({ initialDrafts, initialLogs }: AiDraftsManagerProps) {
  const [drafts, setDrafts] = useState<NewsArticle[]>(initialDrafts)
  const [logs] = useState<AiLog[]>(initialLogs)
  const [activeTab, setActiveTab] = useState<'drafts' | 'logs'>('drafts')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState<'all' | 'completed' | 'failed'>('all')

  // Publish Draft
  const handlePublish = async (id: string, title: string) => {
    if (!confirm(`আপনি কি "${title}" সংবাদটি সরাসরি প্রকাশ করতে চান?`)) return
    setIsProcessing(id)

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })

      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
        setMessage(`"${title.slice(0, 30)}..." সফলভাবে প্রকাশিত হয়েছে।`)
      } else {
        const data = await res.json()
        alert(data.error || 'প্রকাশ করতে ব্যর্থ হয়েছে।')
      }
    } catch {
      alert('নেটওয়ার্ক ত্রুটি।')
    } finally {
      setIsProcessing(null)
    }
  }

  // Delete Draft
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`আপনি কি "${title}" ড্রাফটটি মুছে ফেলতে চান?`)) return
    setIsProcessing(id)

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
        setMessage('ড্রাফট মুছে ফেলা হয়েছে।')
      } else {
        const data = await res.json()
        alert(data.error || 'মুছতে ব্যর্থ হয়েছে।')
      }
    } catch {
      alert('নেটওয়ার্ক ত্রুটি।')
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'completed') return log.status === 'completed'
    if (logFilter === 'failed') return log.status === 'failed'
    return true
  })

  return (
    <div className="space-y-6">
      {/* ── Status Banner ────────────────────────────────────────────────── */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'drafts'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>🤖 অপেক্ষমান AI ড্রাফট</span>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">
            {toBengaliNumber(drafts.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>📋 AI জব ও অডিট লগ</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            {toBengaliNumber(logs.length)}
          </span>
        </button>
      </div>

      {/* ── Tab 1: AI Drafts ─────────────────────────────────────────────── */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            * স্বয়ংক্রিয়ভাবে সংকলিত সকল সংবাদ ড্রাফট হিসেবে সংরক্ষিত হয়। সম্পাদকের যাচাই ও অনুমোদনের পরই কেবল মূল পোর্টালে দৃশ্যমান হবে।
          </div>

          {drafts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-slate-800 text-base">কোনো অপেক্ষমান AI ড্রাফট নেই</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                নতুন সংবাদ সংগ্রহের জন্য &apos;ফিড সোর্স&apos; মেনু থেকে অবিলম্বে ফিড সংগ্রহ চালাতে পারেন।
              </p>
              <Link
                href="/admin/sources"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                📡 ফিড সোর্স মেনুতে যান
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold border border-red-200 text-[11px]">
                        {draft.categoryLabel}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        উৎস: {draft.sourceName}
                      </span>

                      {draft.sourceUrl && draft.sourceUrl !== '#' && (
                        <a
                          href={draft.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-[11px] flex items-center gap-1"
                        >
                          <span>মূল সংবাদ দেখুন</span>
                          <span>↗</span>
                        </a>
                      )}

                      <span className="text-slate-400 text-[11px]">
                        • {formatDateBengali(draft.publishedAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-red-600 transition-colors">
                      <Link href={`/admin/articles/${draft.id}`}>
                        {draft.title}
                      </Link>
                    </h3>

                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">
                      {draft.summary}
                    </p>

                    {draft.tags && draft.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {draft.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      disabled={isProcessing === draft.id}
                      onClick={() => handlePublish(draft.id, draft.title)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing === draft.id ? 'হচ্ছে...' : '✓ সরাসরি প্রকাশ'}
                    </button>

                    <Link
                      href={`/admin/articles/${draft.id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✏️ সম্পাদনা
                    </Link>

                    <button
                      type="button"
                      disabled={isProcessing === draft.id}
                      onClick={() => handleDelete(draft.id, draft.title)}
                      className="px-3.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      🗑️ বাতিল
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: AI Audit Logs ─────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              AI মডেল ও স্বয়ংক্রিয় প্রসেসিং পাইপলাইনের সম্পাদন ও ত্রুটি লগ
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-slate-500">ফিল্টার:</span>
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  logFilter === 'all'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('completed')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  logFilter === 'completed'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সফল
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('failed')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  logFilter === 'failed'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ব্যর্থ
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">তারিখ ও সময়</th>
                    <th className="py-3 px-4">শিরোনাম / উৎস URL</th>
                    <th className="py-3 px-4">মডেল / ইঞ্জিন</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4">বিবরণ / ত্রুটি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        কোনো লগ পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-xs">
                          {formatDateBengali(log.createdAt)}
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate">
                            {log.rawTitle || 'শিরোনামহীন'}
                          </div>
                          <a
                            href={log.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-blue-600 hover:underline truncate block"
                          >
                            {log.sourceUrl}
                          </a>
                        </td>

                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          <div className="font-medium text-xs">{log.provider}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.model}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              log.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.status === 'completed'
                              ? '✓ সম্পন্ন'
                              : log.status === 'failed'
                              ? '✕ ব্যর্থ'
                              : 'প্রসেসিং'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-600">
                          {log.errorMessage ? (
                            <span className="text-red-600 font-medium">{log.errorMessage}</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">ড্রাফট তৈরি সম্পন্ন</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

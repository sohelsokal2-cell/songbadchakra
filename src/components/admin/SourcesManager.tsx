'use client'

import { useState } from 'react'
import { type NewsSource } from '@/types/news'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'

interface SourcesManagerProps {
  initialSources: NewsSource[]
}

const CATEGORIES = [
  { slug: 'bangladesh', label: 'বাংলাদেশ' },
  { slug: 'international', label: 'আন্তর্জাতিক' },
  { slug: 'politics', label: 'রাজনীতি' },
  { slug: 'sports', label: 'খেলা' },
  { slug: 'business', label: 'বাণিজ্য' },
  { slug: 'technology', label: 'প্রযুক্তি' },
  { slug: 'entertainment', label: 'বিনোদন' },
  { slug: 'lifestyle', label: 'জীবনযাপন' },
]

export default function SourcesManager({ initialSources }: SourcesManagerProps) {
  const [sources, setSources] = useState<NewsSource[]>(initialSources)
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestSummary, setIngestSummary] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [category, setCategory] = useState('bangladesh')
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = useState(60)

  // Trigger Ingestion
  const handleRunIngestion = async (sourceId?: string) => {
    setIsIngesting(true)
    setIngestSummary(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ইনজেশন চালাতে ব্যর্থ হয়েছে।')

      const { totalIngested, totalSkipped, totalFailed } = data.summary || {}
      setIngestSummary(
        `সফলভাবে সম্পন্ন: ${toBengaliNumber(totalIngested ?? 0)}টি নতুন ড্রাফট তৈরি হয়েছে, ${toBengaliNumber(totalSkipped ?? 0)}টি স্কিপ হয়েছে।${totalFailed ? ` (${toBengaliNumber(totalFailed)}টি ব্যর্থ)` : ''}`
      )

      // Refresh sources list
      const sourcesRes = await fetch('/api/admin/sources')
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json()
        setSources(sourcesData.sources || [])
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'অপ্রত্যাশিত ত্রুটি ঘটেছে।')
    } finally {
      setIsIngesting(false)
    }
  }

  // Toggle Active
  const handleToggleActive = async (source: NewsSource) => {
    try {
      const updatedStatus = !source.isActive
      const res = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: source.id, isActive: updatedStatus }),
      })

      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === source.id ? { ...s, isActive: updatedStatus } : s))
        )
      }
    } catch {
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।')
    }
  }

  // Delete Source
  const handleDelete = async (id: string, sourceName: string) => {
    if (!confirm(`আপনি কি "${sourceName}" ফিড সোর্সটি ডিলিট করতে চান?`)) return

    try {
      const res = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'ডিলিট করতে সমস্যা হয়েছে।')
      }
    } catch {
      alert('নেটওয়ার্ক ত্রুটি।')
    }
  }

  // Add Source Submit
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const selectedCat = CATEGORIES.find((c) => c.slug === category)
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          feedUrl: feedUrl.trim(),
          category,
          categoryLabel: selectedCat?.label || 'বাংলাদেশ',
          fetchIntervalMinutes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'সোর্স যোগ করতে ব্যর্থ হয়েছে।')

      setSources((prev) => [data, ...prev])
      setShowAddModal(false)
      setName('')
      setUrl('')
      setFeedUrl('')
      setFetchIntervalMinutes(60)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'ত্রুটি ঘটেছে।')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Action Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            সংবাদ ফিড সোর্স ও স্বয়ংক্রিয় সংগ্রহ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            অনুমোদিত বিশ্বস্ত সংবাদ সংস্থার RSS ফিড পরিচালনা এবং সম্পাদকীয় ড্রাফট তৈরির ব্যবস্থা
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRunIngestion()}
            disabled={isIngesting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer ${
              isIngesting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {isIngesting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>ফিড সংগ্রহ চলছে...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>এখনই সব ফিড সংগ্রহ করুন</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>+ নতুন সোর্স যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* ── Notification Alert ───────────────────────────────────────────── */}
      {ingestSummary && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{ingestSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setIngestSummary(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Sources Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">সংবাদ সংস্থা / নাম</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4">ফিড URL</th>
                <th className="py-3 px-4 text-center">ব্যবধান</th>
                <th className="py-3 px-4">সর্বশেষ ফেচ</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    কোনো RSS ফিড সোর্স যুক্ত করা হয়নি।
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{source.name}</div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline font-normal"
                      >
                        {source.url}
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {source.categoryLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-600 truncate max-w-xs" title={source.feedUrl}>
                        {source.feedUrl}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-600">
                      {toBengaliNumber(source.fetchIntervalMinutes)} মি.
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {source.lastFetchedAt ? (
                        <div>
                          <div>{formatDateBengali(source.lastFetchedAt)}</div>
                          {source.lastStatus === 'ok' ? (
                            <span className="inline-block text-[10px] text-emerald-600 font-medium">● সফল</span>
                          ) : source.lastStatus === 'error' ? (
                            <span
                              className="inline-block text-[10px] text-red-600 font-medium cursor-help"
                              title={source.errorMessage || 'ত্রুটি ঘটেছে'}
                            >
                              ● ত্রুটি
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">অপেক্ষারত</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(source)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          source.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {source.isActive ? '✓ সক্রিয়' : '✕ নিষ্ক্রিয়'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunIngestion(source.id)}
                          disabled={isIngesting || !source.isActive}
                          title="এই ফিডটি এখনই রিফ্রেশ করুন"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer disabled:opacity-40"
                        >
                          🔄 ফেচ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(source.id, source.name)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="সোর্স মুছুন"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Source Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="bg-[#111c34] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">নতুন সংবাদ ফিড সোর্স যোগ করুন</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSource} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংবাদ সংস্থার নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রথম আলো"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ওয়েবসাইট URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.prothomalo.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RSS বা Atom ফিড URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.prothomalo.com/feed"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ডিফল্ট ক্যাটাগরি
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ফেচ বিরতি (মিনিট)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    value={fetchIntervalMinutes}
                    onChange={(e) => setFetchIntervalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

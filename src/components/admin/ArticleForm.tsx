'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type NewsArticle } from '@/types/news'
import { CATEGORIES, BANGLADESH_DIVISIONS, toBengaliNumber } from '@/lib/utils'

interface ArticleFormProps {
  initialData?: Partial<NewsArticle>
  isEditing?: boolean
}

// Bengali/English slug helper
function generateSlugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export default function ArticleForm({ initialData, isEditing = false }: ArticleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    summary: initialData?.summary || '',
    content: initialData?.content || '',
    category: initialData?.category || 'bangladesh',
    categoryLabel: initialData?.categoryLabel || 'বাংলাদেশ',
    division: initialData?.division || '',
    district: initialData?.district || '',
    imageUrl: initialData?.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    sourceName: initialData?.sourceName || 'সংবাদচক্র ডেস্ক',
    sourceUrl: initialData?.sourceUrl || '#',
    status: initialData?.status || 'published',
    isBreaking: Boolean(initialData?.isBreaking),
    isOpinion: Boolean(initialData?.isOpinion),
    authorName: initialData?.author?.name || 'নিজস্ব প্রতিবেদক',
    authorTitle: initialData?.author?.title || '',
    authorAvatar: initialData?.author?.avatarUrl || '',
    isVideo: Boolean(initialData?.isVideo),
    videoDuration: initialData?.videoDuration || '',
  })

  // Auto-generate slug when title changes unless custom slug was modified
  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => ({
      ...prev,
      title: newTitle,
      slug: isEditing ? prev.slug : generateSlugFromTitle(newTitle),
    }))
  }

  const handleCategoryChange = (slug: string) => {
    const selected = CATEGORIES.find((c) => c.slug === slug)
    setForm((prev) => ({
      ...prev,
      category: slug,
      categoryLabel: selected?.label || slug,
    }))
  }

  // Word count & reading time
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 180))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload: Partial<NewsArticle> = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        category: form.category,
        categoryLabel: form.categoryLabel,
        division: form.division || undefined,
        district: form.district || undefined,
        imageUrl: form.imageUrl.trim(),
        sourceName: form.sourceName.trim(),
        sourceUrl: form.sourceUrl.trim(),
        status: form.status as 'published' | 'draft',
        isBreaking: form.isBreaking,
        isOpinion: form.isOpinion,
        author: {
          name: form.authorName.trim(),
          title: form.authorTitle ? form.authorTitle.trim() : undefined,
          avatarUrl: form.authorAvatar ? form.authorAvatar.trim() : undefined,
        },
        isVideo: form.isVideo,
        videoDuration: form.videoDuration ? form.videoDuration.trim() : undefined,
        readingTime,
      }

      const url = isEditing && initialData?.id
        ? `/api/admin/articles/${initialData.id}`
        : '/api/admin/articles'

      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'সংবাদ সংরক্ষণ ব্যর্থ হয়েছে।')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/articles')
        router.refresh()
      }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-bengali">
      {/* ── Status Banners ────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <span>✓</span>
          <span>সংবাদটি সফলভাবে {isEditing ? 'আপডেট' : 'প্রকাশ'} করা হয়েছে! রিডাইরেক্ট হচ্ছে...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* ── Left Column: Primary Content ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label htmlFor="article-title" className="block text-sm font-bold text-slate-800 mb-1">
                সংবাদের শিরোনাম <span className="text-red-500">*</span>
              </label>
              <input
                id="article-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="এখানে সংবাদের আকর্ষণীয় শিরোনাম লিখুন..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-base md:text-lg font-bold"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="article-slug" className="block text-xs font-semibold text-slate-500 mb-1">
                ইউআরএল স্লাগ (URL Slug) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">/news/</span>
                <input
                  id="article-slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="news-title-slug"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-mono text-slate-700"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="article-summary" className="block text-sm font-bold text-slate-800 mb-1">
                সারসংক্ষেপ / ভূমিকা (Summary) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="article-summary"
                required
                rows={3}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="সংবাদের মূল বক্তব্য ১-২ বাক্যে লিখুন (পাঠক প্রথমে এটি দেখতে পাবেন)..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Full Article Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="article-content" className="block text-sm font-bold text-slate-800">
                পূর্ণাঙ্গ সংবাদ বিবরণ (Content) <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-slate-400 font-mono">
                {toBengaliNumber(wordCount)} শব্দ • আনুমানিক {toBengaliNumber(readingTime)} মিনিট পঠন
              </div>
            </div>

            <textarea
              id="article-content"
              required
              rows={14}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="সংবাদের বিস্তারিত বিবরণ লিখুন। প্যারাগ্রাফ আলাদা করতে ডাবল এন্টার চাপুন..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-base leading-loose font-bengali"
            />
          </div>

          {/* Columnist / Opinion Details (Conditional) */}
          {form.isOpinion && (
            <div className="bg-teal-50/70 p-6 rounded-2xl border border-teal-200 space-y-4">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <span>✒️</span>
                <span>কলামিস্ট ও লেখক পরিচিতি (মতামতের জন্য)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">লেখকের নাম</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-teal-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবী বা পেশা</label>
                  <input
                    type="text"
                    value={form.authorTitle}
                    onChange={(e) => setForm({ ...form, authorTitle: e.target.value })}
                    placeholder="যেমন: শিক্ষাবিদ ও গবেষক"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-teal-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">লেখকের ছবির URL (Avatar)</label>
                <input
                  type="url"
                  value={form.authorAvatar}
                  onChange={(e) => setForm({ ...form, authorAvatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-white rounded-lg border border-teal-300 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Video Duration Details (Conditional) */}
          {form.isVideo && (
            <div className="bg-red-50/70 p-6 rounded-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <span>🎥</span>
                <span>ভিডিও সংবাদ সেটিংস</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ভিডিও দৈর্ঘ্য (যেমন: ০২:১৫)</label>
                <input
                  type="text"
                  value={form.videoDuration}
                  onChange={(e) => setForm({ ...form, videoDuration: e.target.value })}
                  placeholder="০২:১৫"
                  className="w-48 px-3 py-2 bg-white rounded-lg border border-red-300 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Metadata & Controls ───────────────────────────── */}
        <div className="space-y-6">
          {/* Publish & Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wide">
              প্রকাশনা সেটিংস
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">স্ট্যাটাস</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'published' | 'draft' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
              >
                <option value="published">🟢 সরাসরি প্রকাশিত (Published)</option>
                <option value="draft">🟡 খসড়া সংরক্ষণ (Draft)</option>
              </select>
            </div>

            {/* Breaking News Toggle */}
            <div className="p-3 bg-red-50/70 rounded-xl border border-red-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-800 block">ব্রেকিং নিউজ</span>
                <span className="text-[11px] text-red-600">হোমপেজের টিকার বারে দেখাবে</span>
              </div>
              <input
                type="checkbox"
                checked={form.isBreaking}
                onChange={(e) => setForm({ ...form, isBreaking: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isOpinion}
                  onChange={(e) => setForm({ ...form, isOpinion: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>মতামত ও বিশ্লেষণ আর্টিকেল</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isVideo}
                  onChange={(e) => setForm({ ...form, isVideo: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>ভিডিও ও মাল্টিমিডিয়া সংবাদ</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <span>{isEditing ? '💾 পরিবর্তন সংরক্ষণ করুন' : '🚀 সংবাদ প্রকাশ করুন'}</span>
              )}
            </button>
          </div>

          {/* Category & Region Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wide">
              শ্রেণী ও অঞ্চল
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ক্যাটাগরি <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label} ({cat.labelEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">বিভাগ (ঐচ্ছিক)</label>
              <select
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="">কোনো নির্দিষ্ট বিভাগ নেই</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জেলা (ঐচ্ছিক)</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="যেমন: ঢাকা, বগুড়া, সিলেট"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Feature Image Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wide">
              ফিচার ছবি (Featured Image)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ছবির লিঙ্ক (Image URL)</label>
              <input
                type="url"
                required
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-700"
              />
            </div>

            {/* Thumbnail Preview */}
            <div className="aspect-[16/9] w-full relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <Image
                src={form.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                alt="ছবির প্রিভিউ"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 360px"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">সোর্স নাম</label>
                <input
                  type="text"
                  value={form.sourceName}
                  onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">সোর্স লিঙ্ক</label>
                <input
                  type="text"
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

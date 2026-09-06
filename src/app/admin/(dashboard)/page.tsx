import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import StatCard from '@/components/admin/StatCard'
import { getDashboardStats, getAllArticles, getContactMessages } from '@/lib/news-repository'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'
import { type NewsArticle } from '@/types/news'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [stats, articlesResult, messages] = await Promise.all([
    getDashboardStats(),
    getAllArticles({ limit: 10 }),
    getContactMessages(),
  ])

  const recentArticles: NewsArticle[] = articlesResult.articles.slice(0, 7)
  const recentMessages = messages.slice(0, 4)

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="ড্যাশবোর্ড ওভারভিউ"
        subtitle="সংবাদচক্র পোর্টালের সার্বিক পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম"
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* ── Metric Stat Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="মোট প্রকাশিত সংবাদ"
            value={stats.totalArticles}
            icon="📰"
            variant="blue"
            description="অনলাইন ও আর্কাইভ নিউজ"
          />
          <StatCard
            title="সক্রিয় ব্রেকিং নিউজ"
            value={stats.breakingCount}
            icon="🚨"
            variant="red"
            description="টপ টিকার ও হাইলাইট বার"
          />
          <StatCard
            title="মতামত ও সম্পাদকীয়"
            value={stats.opinionCount}
            icon="✍️"
            variant="purple"
            description="কলামিস্টদের বিশেষ বিশ্লেষণ"
          />
          <StatCard
            title="অপঠিত পাঠক বার্তা"
            value={stats.unreadMessages}
            icon="✉️"
            variant="amber"
            description="ইনবক্সে নতুন প্রতিক্রিয়া"
          />
        </div>

        {/* ── Quick Action Shortcuts Bar ───────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">দ্রুত এক্সেস</h3>
            <p className="text-xs text-slate-500">নিয়ন্ত্রণ কক্ষ থেকে সর্বাধিক ব্যবহৃত ক্রিয়াকলাপ</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <span>✍️</span>
              <span>নতুন সংবাদ লিখুন</span>
            </Link>
            <Link
              href="/admin/breaking"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
            >
              <span>🚨</span>
              <span>ব্রেকিং নিউজ নিয়ন্ত্রণ</span>
            </Link>
            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
            >
              <span>✉️</span>
              <span>পাঠক বার্তা ({toBengaliNumber(stats.unreadMessages)})</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all"
            >
              <span>🌐</span>
              <span>লাইভ পোর্টাল</span>
            </Link>
          </div>
        </div>

        {/* ── Main Content Grid: Recent Articles & Messages ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Recent Articles Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">সাম্প্রতিক সংবাদ তালিকা</h2>
                <p className="text-xs text-slate-500 mt-0.5">পোর্টালে যুক্ত হওয়া শেষ কয়েকটি সংবাদের স্থিতি</p>
              </div>
              <Link
                href="/admin/articles"
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                সকল সংবাদ দেখুন ({toBengaliNumber(stats.totalArticles)}) &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">শিরোনাম</th>
                    <th className="py-3 px-3">বিভাগ</th>
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3 text-center">ব্রেকিং</th>
                    <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {recentArticles.map((article: NewsArticle) => (
                    <tr key={article.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="font-semibold text-slate-800 hover:text-red-600 line-clamp-1 transition-colors"
                        >
                          {article.title}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {article.author?.name || 'সম্পাদকীয় ডেস্ক'} • {toBengaliNumber(article.readingTime || 3)} মি. পাঠ
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {article.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatDateBengali(article.publishedAt)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {article.isBreaking ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            ব্রেকিং
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          সম্পাদনা
                        </Link>
                        <Link
                          href={`/news/${article.slug}`}
                          target="_blank"
                          className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-[11px] transition-colors"
                        >
                          ভিউ ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Col: Recent Messages & Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">সাম্প্রতিক বার্তা</h2>
                  <p className="text-xs text-slate-500 mt-0.5">যোগাযোগ ফর্ম থেকে পাঠানো বার্তা</p>
                </div>
                <Link
                  href="/admin/messages"
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  ইনবক্স ({toBengaliNumber(stats.unreadMessages)}) &rarr;
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentMessages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    কোনো বার্তা পাওয়া যায়নি।
                  </div>
                ) : (
                  recentMessages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800">
                          {msg.name}
                        </span>
                        {!msg.read ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            নতুন
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">পঠিত</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium line-clamp-1">
                        {msg.subject}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  href="/admin/messages"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  সকল বার্তা দেখতে ইনবক্সে যান
                </Link>
              </div>
            </div>

            {/* Quick System Summary */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">সিস্টেম স্ট্যাটাস</span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  অনলাইন
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>ফ্রেমওয়ার্ক: <span className="text-white font-mono">Next.js 16 (Turbopack)</span></div>
                <div>ডাটাবেস লেয়ার: <span className="text-white font-mono">Hybrid Storage (Active)</span></div>
                <div>সর্বশেষ আপডেট: <span className="text-slate-400">{formatDateBengali(new Date().toISOString())}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'ই-পেপার সংস্করণ',
  description: `${SITE_NAME}-এর দৈনিক মুদ্রিত পত্রিকার ডিজিটাল ই-পেপার সংস্করণ ও অনলাইন আর্কাইভ।`,
  alternates: {
    canonical: `https://${SITE_DOMAIN}/epaper`,
  },
}

export default function EPaperPage() {
  const pages = [
    { num: 1, title: 'প্রথম পাতা (প্রধান শিরোনাম)' },
    { num: 2, title: 'জাতীয় সংবাদ ও রাজনীতি' },
    { num: 3, title: 'সম্পাদকীয় ও মুক্তকলাম' },
    { num: 4, title: 'আন্তর্জাতিক খবর' },
    { num: 5, title: 'বাণিজ্য ও অর্থনীতি' },
    { num: 6, title: 'খেলাধুলার জগৎ' },
  ]

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 text-xs text-[var(--color-text-muted)] flex items-center gap-2 font-bengali">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">ই-পেপার</span>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-[var(--color-border)] shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-brand-primary)] font-bengali mb-1 uppercase tracking-wider">
              <span>ডিজিটাল প্রিন্ট সংস্করণ</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-bengali text-[var(--color-text-primary)]">
              {SITE_NAME} ই-পেপার
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] font-bengali mt-1">
              আজকের মুদ্রিত পত্রিকার প্রতিটি পৃষ্ঠার নির্ভুল ডিজিটাল প্রতিরূপ
            </p>
          </div>

          <div className="flex items-center gap-3 font-bengali text-sm">
            <label htmlFor="epaper-date" className="text-[var(--color-text-secondary)] font-medium">
              তারিখ নির্বাচন:
            </label>
            <input
              id="epaper-date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs font-bengali text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-red-50 text-[var(--color-brand-primary)] font-bold rounded-md">
              আজকের সংখ্যা (ঢাকা সংস্করণ)
            </span>
            <span className="text-[var(--color-text-muted)]">• মোট ৮ পৃষ্ঠা</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors cursor-pointer"
            >
              🔍 জুম ইন
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors cursor-pointer"
            >
              📥 পূর্ণাঙ্গ PDF ডাউনলোড
            </button>
          </div>
        </div>
      </div>

      {/* ── E-Paper Pages Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((p) => (
          <div
            key={p.num}
            className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
          >
            {/* Simulated Newspaper Page Canvas */}
            <div className="aspect-[3/4] bg-slate-50 relative border-b border-gray-100 flex flex-col p-4 justify-between select-none">
              <div className="border-b-2 border-black/80 pb-2 text-center">
                <div className="text-[10px] tracking-widest uppercase font-bold text-gray-400">SONGBADCHAKRA</div>
                <div className="text-base font-bold font-bengali text-gray-800">সংবাদচক্র</div>
                <div className="text-[9px] text-gray-500 font-bengali">পৃষ্ঠা {p.num} | বিশেষ সংস্করণ</div>
              </div>

              {/* Fake Newspaper Columns */}
              <div className="grid grid-cols-2 gap-2 my-auto opacity-70">
                <div className="space-y-1.5">
                  <div className="h-3 bg-gray-300 rounded-xs w-full" />
                  <div className="h-16 bg-gray-200 rounded-xs w-full" />
                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-300 rounded-xs w-full" />
                    <div className="h-1.5 bg-gray-300 rounded-xs w-5/6" />
                    <div className="h-1.5 bg-gray-300 rounded-xs w-4/6" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-20 bg-gray-200 rounded-xs w-full" />
                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-300 rounded-xs w-full" />
                    <div className="h-1.5 bg-gray-300 rounded-xs w-full" />
                    <div className="h-1.5 bg-gray-300 rounded-xs w-3/4" />
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-mono border-t pt-1">
                PAGE {p.num}
              </div>

              {/* Hover Read Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-4 py-2 bg-white text-[var(--color-brand-primary)] font-bold text-sm rounded-lg shadow-lg font-bengali">
                  পৃষ্ঠাটি বড় করে দেখুন
                </span>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between bg-white">
              <div>
                <span className="text-xs font-bold font-bengali text-[var(--color-text-primary)] block">
                  পৃষ্ঠা {p.num}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] font-bengali">
                  {p.title}
                </span>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-[var(--color-brand-primary)] hover:underline font-bengali"
              >
                পড়ুন →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

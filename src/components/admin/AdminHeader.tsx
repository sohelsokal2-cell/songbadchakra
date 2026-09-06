import Link from 'next/link'
import { getTodayBengaliDate } from '@/lib/utils'

interface AdminHeaderProps {
  title: string
  subtitle?: string
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const today = getTodayBengaliDate()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-bengali">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="hidden lg:block text-xs text-slate-500 text-right pr-3 border-r border-slate-200">
          <div className="font-semibold text-slate-700">{today}</div>
          <div className="text-[11px] text-emerald-600 font-medium">● সার্ভার সক্রিয়</div>
        </div>

        <Link
          href="/admin/articles/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <span>✍️</span>
          <span>নতুন সংবাদ লিখুন</span>
        </Link>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { SITE_NAME } from '@/lib/utils'

interface AdminSidebarProps {
  unreadCount?: number
}

export default function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navLinks = [
    { label: 'ওভারভিউ', href: '/admin', icon: '📊' },
    { label: 'সকল সংবাদ', href: '/admin/articles', icon: '📰' },
    { label: 'নতুন সংবাদ', href: '/admin/articles/create', icon: '✍️' },
    { label: 'ব্রেকিং নিউজ', href: '/admin/breaking', icon: '🚨' },
    { label: 'AI ড্রাফট', href: '/admin/ai-drafts', icon: '🤖' },
    { label: 'ফিড সোর্স', href: '/admin/sources', icon: '📡' },
    { label: 'পাঠক বার্তা', href: '/admin/messages', icon: '✉️', badge: unreadCount },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      router.push('/admin/login')
      router.refresh()
    } catch {
      router.push('/admin/login')
    }
  }

  return (
    <aside className="w-64 bg-[#111c34] text-white flex flex-col shrink-0 min-h-screen border-r border-slate-800 font-bengali">
      {/* ── Brand Logo Header ─────────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/logo.png" alt={SITE_NAME} width={36} height={36} className="object-contain" />
          <div>
            <div className="font-bold text-base tracking-wide text-white">
              {SITE_NAME} <span className="text-red-500 text-xs px-1.5 py-0.5 bg-red-950/60 rounded border border-red-800/50">CMS</span>
            </div>
            <div className="text-[11px] text-slate-400">সম্পাদকীয় নিয়ন্ত্রণ কক্ষ</div>
          </div>
        </Link>
      </div>

      {/* ── Navigation Links ──────────────────────────────────────────────── */}
      <nav className="flex-1 p-3 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">
          মূল মেনু
        </div>
        {navLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom Section: View Site & Logout ────────────────────────────── */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          <span>🌐 মূল পোর্টাল দেখুন</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-colors border border-red-900/50 cursor-pointer"
        >
          <span>🚪 সাইন আউট করুন</span>
        </button>
      </div>
    </aside>
  )
}

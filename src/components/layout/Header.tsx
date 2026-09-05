'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAV_ITEMS, SITE_NAME, SITE_TAGLINE, getTodayBengaliDate } from '@/lib/utils'
import MobileNav from './MobileNav'
import SearchBar from '@/components/ui/SearchBar'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const todayDate = getTodayBengaliDate()

  return (
    <>
      {/* ── Prothom Alo Style Top Bar ─────────────────────────────────────── */}
      <div className="bg-[var(--color-secondary)] text-white text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-[var(--max-width-site)] mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Left: Date & Weather */}
          <div className="flex items-center gap-4 font-bengali text-white/90">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {todayDate}
            </span>
            <span className="hidden sm:inline-block text-white/30">|</span>
            <span className="hidden sm:flex items-center gap-1 text-white/80">
              <span>☀️ ঢাকা ৩১° সে.</span>
            </span>
          </div>

          {/* Right: Edition switch & E-paper */}
          <div className="flex items-center gap-3 font-bengali">
            <span className="hidden md:inline-block text-white/60 text-[11px] font-mono">
              {SITE_TAGLINE}
            </span>
            <Link
              href="/epaper"
              className="bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded transition-colors"
            >
              ই-পেপার
            </Link>
            <button
              type="button"
              onClick={() => alert('সংবাদচক্রের ইংরেজি সংস্করণ শীঘ্রই উন্মুক্ত করা হবে। আমাদের সাথেই থাকুন!')}
              className="border border-white/20 hover:border-white/50 text-white/80 hover:text-white px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer"
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Brand Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50 shadow-xs">
        <div className="max-w-[var(--max-width-site)] mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0" aria-label={SITE_NAME}>
              <Image
                src="/logo.png"
                alt={`${SITE_NAME} লোগো`}
                width={48}
                height={48}
                className="h-10 md:h-12 w-auto object-contain"
                priority
              />
              <div>
                <span className="text-2xl md:text-3xl font-bold text-[var(--color-secondary)] leading-none block font-bengali tracking-tight">
                  সংবাদ<span className="text-[var(--color-primary)]">চক্র</span>
                </span>
                <span className="text-[10px] text-[var(--color-muted)] font-mono leading-none">
                  songbadchakra.com.bd
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="প্রধান নেভিগেশন" className="hidden xl:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2.5 py-1.5 text-[15px] font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-red-50/70 rounded-md transition-colors font-bengali"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <button
                id="header-search-btn"
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="অনুসন্ধান"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-[var(--color-secondary)] cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Hamburger Mobile */}
              <button
                id="mobile-menu-btn"
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="মোবাইল মেনু খুলুন"
                className="xl:hidden p-2 rounded-full hover:bg-gray-100 transition-colors text-[var(--color-secondary)] cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sub-nav Category bar for Tablets and Desktop (Scrollable) */}
          <div className="hidden lg:flex xl:hidden overflow-x-auto py-2 border-t border-gray-100 gap-2 scrollbar-none">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-1 text-sm font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)] shrink-0 transition-colors font-bengali"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search bar dropdown */}
          {searchOpen && (
            <div className="pb-3 border-t border-[var(--color-border)] pt-3 animate-fadeIn">
              <SearchBar
                autoFocus
                onClose={() => setSearchOpen(false)}
                placeholder="সংবাদ খুঁজুন..."
              />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAV_ITEMS, SITE_NAME } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="মোবাইল নেভিগেশন"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-72 bg-white z-[70] shadow-2xl transition-all duration-300 ease-out flex flex-col ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto visible'
            : 'translate-x-full opacity-0 pointer-events-none invisible'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <Image src="/logo.png" alt={SITE_NAME} width={34} height={34} className="object-contain" />
            <span className="text-white font-bold text-lg">
              সংবাদ<span className="text-[var(--color-primary-light)]">চক্র</span>
            </span>
          </Link>
          <button
            id="mobile-menu-close-btn"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="text-white/80 hover:text-white p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav aria-label="মোবাইল নেভিগেশন লিংক" className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center justify-between px-5 py-3.5 text-[var(--color-secondary)] hover:bg-red-50 hover:text-[var(--color-primary)] border-b border-gray-50 transition-colors font-medium text-base"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <span>{item.label}</span>
              <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Footer links */}
        <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-2">
          {[
            { label: 'আমাদের সম্পর্কে', href: '/about' },
            { label: 'যোগাযোগ', href: '/contact' },
            { label: 'গোপনীয়তা নীতি', href: '/privacy-policy' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

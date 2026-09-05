import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_TAGLINE, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে',
  description: `${SITE_NAME} — বাংলাদেশের আধুনিক, দ্রুত ও বিশ্বাসযোগ্য ডিজিটাল সংবাদ মাধ্যম। আমাদের লক্ষ্য, দৃষ্টিভঙ্গি এবং মূল্যবোধ।`,
  alternates: {
    canonical: `https://${SITE_DOMAIN}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">আমাদের সম্পর্কে</span>
      </nav>

      {/* ── Hero / Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-red-50 to-slate-50 border border-[var(--color-border)] rounded-2xl p-8 md:p-12 mb-10 text-center">
        <div className="inline-block p-3 bg-white rounded-full shadow-xs mb-4">
          <Image src="/logo.png" alt={SITE_NAME} width={160} height={50} className="h-10 w-auto object-contain" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-bengali text-[var(--color-text-primary)] mb-3">
          {SITE_NAME} — {SITE_TAGLINE}
        </h1>
        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto font-bengali leading-relaxed">
          একটি আধুনিক, দ্রুত ও নিরপেক্ষ ডিজিটাল সংবাদ মাধ্যম। তথ্যপ্রযুক্তির সর্বোত্তম ব্যবহারের মাধ্যমে বস্তুনিষ্ঠ সংবাদ সবার কাছে পৌঁছে দেওয়াই আমাদের অঙ্গীকার।
        </p>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="w-12 h-12 bg-red-100 text-[var(--color-brand-primary)] rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-bengali text-[var(--color-text-primary)] mb-2">দ্রুত ও নির্ভরযোগ্য</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            ২৪ ঘণ্টা সার্বক্ষণিক খবরের আপডেট এবং তথ্যের সত্যতা যাচাই করে দ্রুততম সময়ে পাঠকের কাছে পৌঁছে দিতে আমরা প্রতিজ্ঞাবদ্ধ।
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-bengali text-[var(--color-text-primary)] mb-2">বস্তুনিষ্ঠ সাংবাদিকতা</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            কোনো প্রকার পক্ষপাতিত্ব ছাড়া সত্য ও নির্ভরযোগ্য তথ্য পরিবেশনই আমাদের মূল ভিত্তি। কোনো গুজবের স্থান আমাদের প্ল্যাটফর্মে নেই।
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-bengali text-[var(--color-text-primary)] mb-2">আধুনিক প্রযুক্তি</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            সর্বাধুনিক ওয়েব প্রযুক্তি ও কৃত্রিম বুদ্ধিমত্তার সহায়তায় ব্যবহারকারীকে দ্রুততম ও পরিচ্ছন্ন পাঠক অভিজ্ঞতা উপহার দেওয়া।
          </p>
        </div>
      </div>

      {/* ── Detailed Narrative ──────────────────────────────────────────── */}
      <div className="bg-white p-8 md:p-10 rounded-2xl border border-[var(--color-border)] space-y-6 text-[var(--color-text-secondary)] leading-relaxed font-bengali">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] border-b pb-3">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
        <p>
          ডিজিটাল বাংলাদেশে সঠিক ও বস্তুনিষ্ঠ সংবাদ প্রাপ্তি প্রতিটি নাগরিকের মৌলিক অধিকার। &ldquo;{SITE_NAME}&rdquo; সেই লক্ষ্যেই কাজ করছে—যাতে প্রতিটি পাঠক মুহূর্তের মধ্যে দেশের এবং বিশ্বের ঘটে যাওয়া গুরুত্বপূর্ণ ঘটনাবলি সহজ ও সাবলীল বাংলায় জানতে পারেন।
        </p>
        <p>
          আমাদের সংবাদ সংগ্রহ প্রক্রিয়া আইনসম্মত ও উন্মুক্ত ডিজিটাল সোর্সের সাথে সমন্বিত। সম্পাদকীয় নীতিমালা ও এআই প্রযুক্তির সঠিক সমন্বয়ে আমরা সংবাদের গুণগত মান বজায় রাখতে বদ্ধপরিকর।
        </p>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] pt-4">সম্পাদকীয় নীতিমালা</h3>
        <p>
          ১. তথ্যের শতভাগ সত্যতা ও উৎস যাচাই।<br />
          ২. সংবেদনশীল বিষয়ে দায়িত্বশীল উপস্থাপনা।<br />
          ৩. জনস্বার্থমূলক বিষয়াবলিতে সর্বোচ্চ গুরুত্ব প্রদান।<br />
          ৪. ভুল সংশোধন ও স্বচ্ছতা নিশ্চিতকরণ।
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'বার্তা পাঠানো সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }

      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">যোগাযোগ</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold font-bengali text-[var(--color-text-primary)] mb-2">
          আমাদের সাথে যোগাযোগ করুন
        </h1>
        <p className="text-[var(--color-text-muted)] font-bengali">
          যেকোনো প্রশ্ন, মতামত, সংবাদ বিজ্ঞপ্তি বা বিজ্ঞাপনের জন্য সরাসরি যোগাযোগ করতে পারেন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* ── Contact Form ────────────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <h2 className="text-xl font-bold font-bengali text-[var(--color-text-primary)] mb-6 border-b pb-3">
            বার্তা পাঠান
          </h2>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold font-bengali text-emerald-800 mb-1">
                আপনার বার্তা সফলভাবে পাঠানো হয়েছে!
              </h3>
              <p className="text-sm text-emerald-700 font-bengali">
                আমরা আপনার বার্তাটি পর্যালোচনা করে দ্রুততম সময়ে উত্তর দেব। ধন্যবাদ।
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                নতুন বার্তা পাঠান
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-bengali">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    placeholder="আপনার পুরো নাম"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    ইমেইল ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    placeholder="০১৭১XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    বিষয় <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                    placeholder="বার্তার বিষয়বস্তু"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  আপনার বার্তা <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  placeholder="বিস্তারিত বার্তা এখানে লিখুন..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
              </button>
            </form>
          )}
        </div>

        {/* ── Contact Info Cards ──────────────────────────────────────────── */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <h3 className="text-lg font-bold font-bengali text-[var(--color-text-primary)] mb-4 border-b pb-2">
              কার্যালয় ঠিকানা
            </h3>
            <div className="space-y-4 text-sm text-[var(--color-text-secondary)] font-bengali">
              <div className="flex items-start gap-3">
                <span className="text-[var(--color-brand-primary)] mt-1">📍</span>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{SITE_NAME} প্রধান কার্যালয়</p>
                  <p>লেভেল ৫, হাউজ ১৮, রোড ৭, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-brand-primary)]">✉️</span>
                <p>ইমেইল: info@{SITE_DOMAIN}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-brand-primary)]">📞</span>
                <p>ফোন: +৮৮০ ২ ৯৮৭৬৫৪৩</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-[var(--color-border)]">
            <h3 className="text-base font-bold font-bengali text-[var(--color-text-primary)] mb-3">
              বিভাগীয় ইমেইল
            </h3>
            <ul className="text-xs space-y-2 text-[var(--color-text-muted)] font-mono">
              <li><strong className="text-[var(--color-text-secondary)] font-bengali">বার্তা বিভাগ:</strong> news@{SITE_DOMAIN}</li>
              <li><strong className="text-[var(--color-text-secondary)] font-bengali">বিজ্ঞাপন বিভাগ:</strong> ads@{SITE_DOMAIN}</li>
              <li><strong className="text-[var(--color-text-secondary)] font-bengali">সম্পাদকীয়:</strong> editor@{SITE_DOMAIN}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

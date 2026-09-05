import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'গোপনীয়তা নীতি',
  description: `${SITE_NAME}-এর ব্যবহারকারীদের তথ্য নিরাপত্তা ও গোপনীয়তা সম্পর্কিত বিস্তারিত নীতিমালা।`,
  alternates: {
    canonical: `https://${SITE_DOMAIN}/privacy-policy`,
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-8">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-brand-primary)] transition-colors">
          হোম
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] font-medium">গোপনীয়তা নীতি</span>
      </nav>

      <div className="max-w-4xl bg-white p-8 md:p-12 rounded-2xl border border-[var(--color-border)] shadow-xs mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold font-bengali text-[var(--color-text-primary)] mb-4 border-b pb-4">
          গোপনীয়তা নীতি (Privacy Policy)
        </h1>

        <p className="text-xs text-[var(--color-text-muted)] mb-8 font-mono">
          সর্বশেষ হালনাগাদ: ১ জানুয়ারি, ২০২৬
        </p>

        <div className="space-y-6 text-[var(--color-text-secondary)] font-bengali text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">১. ভূমিকা</h2>
            <p>
              &ldquo;{SITE_NAME}&rdquo; (www.{SITE_DOMAIN}) আপনার গোপনীয়তাকে সম্মান করে এবং পাঠকের ব্যক্তিগত তথ্যের সুরক্ষা প্রদানে প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতিতে আমরা ব্যাখ্যা করেছি কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সংরক্ষণ করা হয়।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">২. যে তথ্য আমরা সংগ্রহ করি</h2>
            <p className="mb-2">আমরা মূলত দুই ধরনের তথ্য সংগ্রহ করতে পারি:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>ব্যক্তিগত তথ্য:</strong> আপনি যখন আমাদের সাথে যোগাযোগ করেন, মতামত পাঠান বা নিউজলেটার সাবস্ক্রাইব করেন (যেমন নাম, ইমেইল)।</li>
              <li><strong>অ-ব্যক্তিগত ব্রাউজিং তথ্য:</strong> আপনার ব্রাউজারের ধরন, আইপি অ্যাড্রেস, ভিজিট করা পেজ এবং সাইট ব্যবহারের সময়সীমা।</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">৩. কুকিজ (Cookies) এর ব্যবহার</h2>
            <p>
              আমাদের সাইটের পাঠক অভিজ্ঞতা উন্নত করতে কুকিজ ব্যবহৃত হতে পারে। এটি আপনার পছন্দ সংরক্ষণ করতে এবং সাইটের পারফরম্যান্স অপ্টিমাইজ করতে সহায়তা করে। আপনি যেকোনো সময় ব্রাউজারের সেটিংস থেকে কুকিজ নিষ্ক্রিয় করতে পারেন।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">৪. তথ্যের নিরাপত্তা ও তৃতীয় পক্ষ</h2>
            <p>
              আমরা পাঠকের কোনো ব্যক্তিগত তথ্য বাণিজ্যিক উদ্দেশ্যে তৃতীয় পক্ষের কাছে বিক্রি, ভাড়া বা হস্তান্তর করি না। আইনি বাধ্যবাধকতা ব্যতীত ব্যবহারকারীর ব্যক্তিগত তথ্য সম্পূর্ণ গোপন রাখা হয়।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">৫. নীতিমালার পরিবর্তন</h2>
            <p>
              {SITE_NAME} যেকোনো সময় এই নীতিমালায় প্রয়োজনীয় পরিবর্তন বা পরিমার্জন করার অধিকার সংরক্ষণ করে। যেকোনো পরিবর্তন এই পৃষ্ঠায় প্রকাশের সাথে সাথে কার্যকর হবে।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">৬. আমাদের সাথে যোগাযোগের উপায়</h2>
            <p>
              এই গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের ইমেইল করতে পারেন: privacy@{SITE_DOMAIN}।
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

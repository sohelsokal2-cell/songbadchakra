import Link from 'next/link'
import Image from 'next/image'
import { NAV_ITEMS, SITE_NAME, SITE_DESCRIPTION } from '@/lib/utils'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-secondary)] text-white mt-12">
      {/* Main footer */}
      <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label={SITE_NAME}>
              <Image src="/logo.png" alt={SITE_NAME} width={48} height={48} className="object-contain" />
              <div>
                <span className="text-xl font-bold leading-none block">
                  সংবাদ<span className="text-[var(--color-primary-light)]">চক্র</span>
                </span>
                <span className="text-xs text-white/60 leading-none">SongbadChakra</span>
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {SITE_DESCRIPTION}
            </p>
            <p className="text-white/50 text-xs">songbadchakra.com.bd</p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-2">
              বিভাগসমূহ
            </h3>
            <ul className="space-y-2">
              {NAV_ITEMS.slice(0, 5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-white/70 hover:text-[var(--color-primary-light)] text-sm transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] inline-block" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More categories */}
          <div>
            <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-2">
              আরও বিভাগ
            </h3>
            <ul className="space-y-2">
              {NAV_ITEMS.slice(5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-white/70 hover:text-[var(--color-primary-light)] text-sm transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] inline-block" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Important links */}
          <div>
            <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-2">
              গুরুত্বপূর্ণ লিংক
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'আমাদের সম্পর্কে', href: '/about' },
                { label: 'যোগাযোগ করুন', href: '/contact' },
                { label: 'গোপনীয়তা নীতি', href: '/privacy-policy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-[var(--color-primary-light)] text-sm transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] inline-block" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/50 text-xs text-center sm:text-left">
            © {currentYear} সংবাদচক্র। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-white/40 text-xs">
            সত্যের পথে, সবার সাথে
          </p>
        </div>
      </div>
    </footer>
  )
}

import type { Metadata } from 'next'
import BreakingNews from '@/components/news/BreakingNews'
import ProthomAloLeadGrid from '@/components/news/ProthomAloLeadGrid'
import DistrictNewsSection from '@/components/news/DistrictNewsSection'
import OpinionSection from '@/components/news/OpinionSection'
import VideoSection from '@/components/news/VideoSection'
import CategorySection from '@/components/news/CategorySection'
import AdvertisementPlaceholder from '@/components/ui/AdvertisementPlaceholder'
import {
  getFeaturedNews,
  getLatestNews,
  getPopularNews,
  getNewsByCategory,
} from '@/data/mockNews'
import { SITE_NAME, SITE_DESCRIPTION, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} | সত্যের পথে, সবার সাথে | বাংলা নিউজ পোর্টাল`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `https://${SITE_DOMAIN}` },
}

export default function HomePage() {
  const featured = getFeaturedNews()
  const latestAll = getLatestNews(10)
  const popularAll = getPopularNews(10)
  const subLeads = latestAll.slice(1, 3)

  const bangladeshNews    = getNewsByCategory('bangladesh').slice(0, 4)
  const internationalNews = getNewsByCategory('international').slice(0, 4)
  const sportsNews        = getNewsByCategory('sports').slice(0, 4)
  const techNews          = getNewsByCategory('technology').slice(0, 4)
  const businessNews      = getNewsByCategory('business').slice(0, 4)
  const entertainNews     = getNewsByCategory('entertainment').slice(0, 4)

  return (
    <>
      {/* ── Breaking News Ticker ────────────────────────────────────────── */}
      <BreakingNews />

      <div className="max-w-[var(--max-width-site)] mx-auto px-4 py-6">
        {/* ── Signature Prothom Alo Lead Grid (Lead + Sub-leads + Tabbed Box) ── */}
        <ProthomAloLeadGrid
          leadStory={featured}
          subLeads={subLeads}
          latestNews={latestAll}
          popularNews={popularAll}
        />

        {/* ── Top Horizontal Ad Banner ────────────────────────────────────── */}
        <div className="mb-10">
          <AdvertisementPlaceholder size="banner" label="শীর্ষ বিজ্ঞাপন" />
        </div>

        {/* ── Regional / District News ("সারাদেশের খবর") ─────────────────── */}
        <DistrictNewsSection />

        {/* ── Main Category Content Columns ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <CategorySection
            title="বাংলাদেশ"
            categorySlug="bangladesh"
            articles={bangladeshNews}
            columns={2}
          />
          <CategorySection
            title="আন্তর্জাতিক"
            categorySlug="international"
            articles={internationalNews}
            columns={2}
          />
        </div>

        {/* ── Opinion & Editorial Section ("মতামত ও সম্পাদকীয়") ─────────── */}
        <OpinionSection />

        {/* ── Video & Multimedia Section ─────────────────────────────────── */}
        <VideoSection />

        {/* ── Sports & Technology Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <CategorySection
            title="খেলাধুলা"
            categorySlug="sports"
            articles={sportsNews}
            columns={2}
          />
          <CategorySection
            title="প্রযুক্তি"
            categorySlug="technology"
            articles={techNews}
            columns={2}
          />
        </div>

        {/* ── Mid Page Ad Banner ──────────────────────────────────────────── */}
        <div className="mb-10">
          <AdvertisementPlaceholder size="banner" label="বিজ্ঞাপন" />
        </div>

        {/* ── Business & Entertainment Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <CategorySection
            title="ব্যবসা ও বাণিজ্য"
            categorySlug="business"
            articles={businessNews}
            columns={2}
          />
          <CategorySection
            title="বিনোদন ও সংস্কৃতি"
            categorySlug="entertainment"
            articles={entertainNews}
            columns={2}
          />
        </div>
      </div>
    </>
  )
}

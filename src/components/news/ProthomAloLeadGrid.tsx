import Link from 'next/link'
import Image from 'next/image'
import { type NewsArticle } from '@/types/news'
import { formatRelativeTime } from '@/lib/utils'
import TabbedNewsWidget from './TabbedNewsWidget'

interface ProthomAloLeadGridProps {
  leadStory: NewsArticle
  subLeads: NewsArticle[]
  latestNews: NewsArticle[]
  popularNews: NewsArticle[]
}

export default function ProthomAloLeadGrid({
  leadStory,
  subLeads,
  latestNews,
  popularNews,
}: ProthomAloLeadGridProps) {
  if (!leadStory) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center text-slate-500 font-bengali mb-10 shadow-xs">
        <div className="text-4xl mb-3">📰</div>
        <h3 className="text-lg font-bold text-slate-800">বর্তমানে কোনো প্রকাশিত সংবাদ নেই</h3>
        <p className="text-sm text-slate-500 mt-1">অ্যাডমিন প্যানেল থেকে &apos;AI ইঞ্জিন&apos; ইনজেশন চালান অথবা নতুন সংবাদ লিখুন।</p>
      </div>
    )
  }

  return (
    <section className="mb-10" aria-label="প্রধান সংবাদ">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── 1. Main Lead Story (Left / Center - 6 Cols) ────────────────── */}
        <article className="lg:col-span-6 bg-white rounded-2xl border border-[var(--color-border)] p-4 md:p-5 shadow-xs flex flex-col justify-between group">
          <div>
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-4">
              <Link href={`/news/${leadStory.slug}`}>
                <Image
                  src={leadStory.imageUrl}
                  alt={leadStory.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </Link>
              {leadStory.isBreaking && (
                <span className="absolute top-3 left-3 bg-[var(--color-brand-primary)] text-white text-xs font-bold px-2.5 py-1 rounded shadow-md animate-pulse">
                  ব্রেকিং
                </span>
              )}
              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2.5 py-0.5 rounded backdrop-blur-xs font-bengali">
                {leadStory.categoryLabel}
              </span>
            </div>

            <Link href={`/news/${leadStory.slug}`}>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-bengali text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors leading-tight mb-3">
                {leadStory.title}
              </h2>
            </Link>

            <p className="text-sm md:text-base text-[var(--color-text-secondary)] font-bengali leading-relaxed line-clamp-3 mb-4">
              {leadStory.summary}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border)]">
            <span className="font-medium text-[var(--color-brand-primary)]">{leadStory.sourceName}</span>
            <time dateTime={leadStory.publishedAt}>{formatRelativeTime(leadStory.publishedAt)}</time>
          </div>
        </article>

        {/* ── 2. Sub-lead Stories (Center / Secondary - 3 Cols) ──────────── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {subLeads.slice(0, 2).map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden mb-3">
                  <Link href={`/news/${story.slug}`}>
                    <Image
                      src={story.imageUrl}
                      alt={story.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 25vw"
                    />
                  </Link>
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bengali">
                    {story.categoryLabel}
                  </span>
                </div>

                <Link href={`/news/${story.slug}`}>
                  <h3 className="text-base font-bold font-bengali text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors leading-snug line-clamp-3 mb-2">
                    {story.title}
                  </h3>
                </Link>
              </div>

              <div className="text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] flex justify-between">
                <span>{story.sourceName}</span>
                <time dateTime={story.publishedAt}>{formatRelativeTime(story.publishedAt)}</time>
              </div>
            </article>
          ))}
        </div>

        {/* ── 3. Prothom Alo Style Tabbed Widget (Right - 3 Cols) ────────── */}
        <div className="lg:col-span-3">
          <TabbedNewsWidget latestNews={latestNews} popularNews={popularNews} />
        </div>
      </div>
    </section>
  )
}

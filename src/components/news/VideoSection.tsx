import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/types/news'

export default function VideoSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null

  const videos = articles
  const [mainVideo, ...subVideos] = videos

  return (
    <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 mb-10 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-7 bg-red-600 rounded-full inline-block" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-bengali text-white flex items-center gap-2">
              ভিডিও ও মাল্টিমিডিয়া
              <span className="bg-red-600 text-white text-[10px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                LIVE
              </span>
            </h2>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-bengali">সব ভিডিও দেখতে ক্লিক করুন</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main large video */}
        {mainVideo && (
          <div className="lg:col-span-7 group">
            <Link href={`/news/${mainVideo.slug}`} className="block relative aspect-video rounded-xl overflow-hidden mb-3">
              <Image
                src={mainVideo.imageUrl}
                alt={mainVideo.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {mainVideo.videoDuration && (
                <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded font-bengali font-bold">
                  ⏱ {mainVideo.videoDuration}
                </span>
              )}
            </Link>
            <Link href={`/news/${mainVideo.slug}`}>
              <h3 className="text-lg md:text-xl font-bold font-bengali text-white group-hover:text-red-400 transition-colors leading-snug">
                {mainVideo.title}
              </h3>
            </Link>
          </div>
        )}

        {/* Sub videos list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {subVideos.map((vid) => (
            <div key={vid.id} className="group flex gap-3 items-center bg-slate-800/60 p-3 rounded-xl hover:bg-slate-800 transition-colors">
              <Link href={`/news/${vid.slug}`} className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                <Image
                  src={vid.imageUrl}
                  alt={vid.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="128px"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {vid.videoDuration && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-bengali">
                    {vid.videoDuration}
                  </span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/news/${vid.slug}`}>
                  <h4 className="text-sm font-bold font-bengali text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                    {vid.title}
                  </h4>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

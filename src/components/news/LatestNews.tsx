import { getLatestNews } from '@/data/mockNews'
import NewsCard from './NewsCard'

interface LatestNewsProps {
  limit?: number
}

export default function LatestNews({ limit = 6 }: LatestNewsProps) {
  const articles = getLatestNews(limit)

  return (
    <aside aria-labelledby="sidebar-latest">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
        <h2 id="sidebar-latest" className="text-base font-bold text-[var(--color-secondary)]">
          সর্বশেষ খবর
        </h2>
      </div>
      <div className="space-y-0">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    </aside>
  )
}

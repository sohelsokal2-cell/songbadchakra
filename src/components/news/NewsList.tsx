import { type NewsArticle } from '@/types/news'
import NewsCard from './NewsCard'

interface NewsListProps {
  articles: NewsArticle[]
  variant?: 'grid' | 'list'
  columns?: 2 | 3 | 4
  className?: string
}

const colClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export default function NewsList({
  articles,
  variant = 'grid',
  columns = 3,
  className = '',
}: NewsListProps) {
  if (articles.length === 0) return null

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} variant="horizontal" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${colClasses[columns]} gap-5 ${className}`}>
      {articles.map((article, idx) => (
        <NewsCard key={article.id} article={article} priority={idx < 3} />
      ))}
    </div>
  )
}

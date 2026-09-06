import 'server-only'
import type { NewsArticle } from '@/types/news'
import { getAllArticles } from '@/lib/news-repository'

export async function listPublishedArticles(): Promise<NewsArticle[]> {
  return (await getAllArticles({ status: 'published', limit: 100 })).articles
}

export async function getPublishedArticleBySlug(slug: string) {
  return (await listPublishedArticles()).find((article) => article.slug === slug)
}

export async function listLatestArticles(limit = 6) {
  return (await listPublishedArticles()).slice(0, limit)
}

export async function listArticlesByCategory(category: string, limit?: number) {
  const articles = (await listPublishedArticles()).filter((article) => article.category === category)
  return limit ? articles.slice(0, limit) : articles
}

export async function listBreakingArticles() {
  return (await listPublishedArticles()).filter((article) => article.isBreaking)
}

export async function listOpinionArticles(limit?: number) {
  const articles = (await listPublishedArticles()).filter((article) => article.isOpinion)
  return limit ? articles.slice(0, limit) : articles
}

export async function listVideoArticles(limit?: number) {
  const articles = (await listPublishedArticles()).filter((article) => article.isVideo)
  return limit ? articles.slice(0, limit) : articles
}

export async function searchPublishedArticles(query: string) {
  const normalized = query.toLowerCase().trim()
  return (await listPublishedArticles()).filter((article) =>
    `${article.title} ${article.summary} ${article.categoryLabel}`.toLowerCase().includes(normalized)
  )
}

export async function listRelatedArticles(article: NewsArticle, limit = 3) {
  return (await listPublishedArticles())
    .filter((candidate) => candidate.id !== article.id && candidate.category === article.category)
    .slice(0, limit)
}

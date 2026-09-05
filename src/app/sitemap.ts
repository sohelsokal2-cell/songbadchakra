import type { MetadataRoute } from 'next'
import { CATEGORIES, getSiteUrl } from '@/lib/utils'
import { getAllNews } from '@/data/mockNews'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()
  const articles = getAllNews()

  // Find newest published timestamp
  const latestArticleDate = articles.length > 0
    ? new Date(articles[0].publishedAt)
    : new Date('2026-09-01T00:00:00.000Z')

  const siteContentBaseDate = new Date('2026-09-01T00:00:00.000Z')

  // Base pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestArticleDate,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: siteContentBaseDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: siteContentBaseDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: siteContentBaseDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Category pages with actual newest article timestamp in category
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => {
    const categoryArticles = articles.filter((a) => a.category === cat.slug)
    const catLastMod = categoryArticles.length > 0
      ? new Date(categoryArticles[0].publishedAt)
      : latestArticleDate

    return {
      url: `${baseUrl}/${cat.slug}`,
      lastModified: catLastMod,
      changeFrequency: 'hourly',
      priority: 0.8,
    }
  })

  // Article pages
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes]
}

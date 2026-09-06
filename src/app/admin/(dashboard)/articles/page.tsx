import AdminHeader from '@/components/admin/AdminHeader'
import ArticleTable from '@/components/admin/ArticleTable'
import { getAllArticles } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

export default async function AdminArticlesPage() {
  const { articles } = await getAllArticles({ limit: 100 })

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="সকল সংবাদ ব্যবস্থাপনা"
        subtitle="পোর্টালে প্রকাশিত সকল সংবাদ তালিকা, সম্পাদনা ও নিয়ন্ত্রণ"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <ArticleTable initialArticles={articles} />
      </div>
    </div>
  )
}

import AdminHeader from '@/components/admin/AdminHeader'
import BreakingManager from '@/components/admin/BreakingManager'
import { getAllArticles } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

export default async function AdminBreakingPage() {
  const { articles } = await getAllArticles({ limit: 100, status: 'published' })

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="ব্রেকিং নিউজ ব্যবস্থাপনা"
        subtitle="লাইভ ব্রেকিং টিকার পরিচালনা ও জরুরি সংবাদ হাইলাইট"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <BreakingManager initialArticles={articles} />
      </div>
    </div>
  )
}

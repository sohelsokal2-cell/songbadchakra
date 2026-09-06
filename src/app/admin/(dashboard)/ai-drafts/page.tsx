import AdminHeader from '@/components/admin/AdminHeader'
import AiDraftsManager from '@/components/admin/AiDraftsManager'
import { getAllArticles, getAllAiLogs } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI ড্রাফট ও ইনজেশন পর্যালোচনা | সংবাদচক্র CMS',
}

export default async function AiDraftsPage() {
  const [articlesRes, logs] = await Promise.all([
    getAllArticles({ status: 'draft', limit: 100 }),
    getAllAiLogs(100),
  ])

  // Filter drafts to those that originated from automated sources or drafts in general
  const drafts = articlesRes.articles

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="AI ড্রাফট ও ইনজেশন পর্যালোচনা"
        subtitle="সংগ্রহকৃত সংবাদের সম্পাদকীয় যাচাই, সংশোধন এবং এক-ক্লিকে প্রকাশের ব্যবস্থা"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <AiDraftsManager initialDrafts={drafts} initialLogs={logs} />
      </div>
    </div>
  )
}

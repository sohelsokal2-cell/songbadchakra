import AdminHeader from '@/components/admin/AdminHeader'
import SourcesManager from '@/components/admin/SourcesManager'
import { getAllSources } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'ফিড সোর্স ব্যবস্থাপনা | সংবাদচক্র CMS',
}

export default async function SourcesPage() {
  const sources = await getAllSources()

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="সংবাদ ফিড সোর্স (RSS / Atom)"
        subtitle="সংবাদ সংগ্রহের উৎস পরিচালনা, ক্যাটাগরি ম্যাপিং এবং সময়সূচী নিয়ন্ত্রণ"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <SourcesManager initialSources={sources} />
      </div>
    </div>
  )
}

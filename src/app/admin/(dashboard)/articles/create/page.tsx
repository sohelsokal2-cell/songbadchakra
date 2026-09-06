import AdminHeader from '@/components/admin/AdminHeader'
import ArticleForm from '@/components/admin/ArticleForm'

export const dynamic = 'force-dynamic'

export default function CreateArticlePage() {
  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="নতুন সংবাদ প্রকাশ"
        subtitle="পোর্টালে নতুন খবর, সম্পাদকীয় বা মাল্টিমিডিয়া প্রতিবেদন প্রকাশ করুন"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <ArticleForm isEditing={false} />
      </div>
    </div>
  )
}

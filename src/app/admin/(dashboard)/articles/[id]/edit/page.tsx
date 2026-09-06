import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import ArticleForm from '@/components/admin/ArticleForm'
import { getArticleById } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params
  const article = await getArticleById(id)

  if (!article) {
    notFound()
  }

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="সংবাদ সম্পাদনা"
        subtitle={`"${article.title}" সংবাদের তথ্য ও কনটেন্ট হালনাগাদ`}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <ArticleForm initialData={article} isEditing={true} />
      </div>
    </div>
  )
}

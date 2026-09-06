import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminArticleRedirectPage({ params }: Props) {
  const { id } = await params
  redirect(`/admin/articles/${id}/edit`)
}

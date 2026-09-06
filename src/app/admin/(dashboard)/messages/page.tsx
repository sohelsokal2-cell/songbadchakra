import AdminHeader from '@/components/admin/AdminHeader'
import MessagesInbox from '@/components/admin/MessagesInbox'
import { getContactMessages } from '@/lib/news-repository'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const messages = await getContactMessages()

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="পাঠক বার্তা ও প্রতিক্রিয়া"
        subtitle="যোগাযোগ ফর্ম ও মতামত বক্স থেকে সংগৃহীত বার্তার ইনবক্স"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <MessagesInbox initialMessages={messages} />
      </div>
    </div>
  )
}

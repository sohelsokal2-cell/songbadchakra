import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getDashboardStats } from '@/lib/news-repository'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuth = await isAuthenticatedAdmin()

  if (!isAuth) {
    redirect('/admin/login')
  }

  const stats = await getDashboardStats()

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* ── Fixed / Sticky Sidebar on Large Screens ── */}
      <div className="hidden md:block shrink-0">
        <AdminSidebar unreadCount={stats.unreadMessages} />
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen overflow-y-auto">
        {/* Mobile quick-nav header when sidebar is hidden */}
        <div className="md:hidden bg-[#111c34] text-white p-3 flex items-center justify-between border-b border-slate-800">
          <div className="font-bold text-sm">সংবাদচক্র CMS</div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/admin" className="text-slate-300 hover:text-white">ড্যাশবোর্ড</Link>
            <Link href="/admin/articles" className="text-slate-300 hover:text-white">সংবাদ</Link>
            <Link href="/admin/ai" className="text-emerald-400 hover:text-emerald-300 font-semibold">⚡ AI</Link>
            <Link href="/admin/articles/create" className="text-red-400 hover:text-red-300 font-semibold">+ নতুন</Link>
            <Link href="/admin/messages" className="text-amber-400 hover:text-amber-300 font-semibold">
              বার্তা ({stats.unreadMessages})
            </Link>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

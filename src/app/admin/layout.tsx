import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'অ্যাডমিন ড্যাশবোর্ড',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-red-600 selection:text-white">
      {children}
    </div>
  )
}

import type { Metadata } from 'next'
import { Noto_Serif_Bengali, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { SITE_NAME, SITE_DESCRIPTION, SITE_DOMAIN } from '@/lib/utils'

const notoBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE_DOMAIN}`),
  title: {
    default: `${SITE_NAME} | সত্যের পথে, সবার সাথে`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'বাংলাদেশ', 'সংবাদ', 'নিউজ', 'বাংলা খবর',
    'bangladeshi news', 'bangla news', 'songbadchakra',
  ],
  authors: [{ name: SITE_NAME, url: `https://${SITE_DOMAIN}` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: `https://${SITE_DOMAIN}`,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | সত্যের পথে, সবার সাথে`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | সত্যের পথে, সবার সাথে`,
    description: SITE_DESCRIPTION,
    creator: '@songbadchakra',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: `https://${SITE_DOMAIN}`,
    languages: { 'bn-BD': `https://${SITE_DOMAIN}` },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="bn"
      className={`${notoBengali.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col bg-[var(--color-surface)]"
        suppressHydrationWarning
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

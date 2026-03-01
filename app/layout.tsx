import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/contexts/language-context'
import { PortfolioDataProvider } from '@/contexts/portfolio-data-context'
import { getPortfolioData } from '@/lib/data'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Tong2 Portfolio',
  description: 'Tong2 Developer Portfolio',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 서버에서 데이터를 미리 가져와서 클라이언트로 전달
  const data = await getPortfolioData()

  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          <PortfolioDataProvider initialData={data}>
            {children}
            <Analytics />
          </PortfolioDataProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

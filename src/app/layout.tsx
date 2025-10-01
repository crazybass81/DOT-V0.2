import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PlatformShell from '../components/platform/PlatformShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DOT Platform V0.2',
  description: '마이크로 앱 아키텍처 기반 확장 가능한 플랫폼',
  keywords: ['마이크로앱', '플랫폼', 'Next.js', 'Supabase', 'MCP'],
  authors: [{ name: 'DOT Platform Team' }],
  openGraph: {
    title: 'DOT Platform V0.2',
    description: '마이크로 앱 아키텍처 기반 확장 가능한 플랫폼',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div id="platform-root">
          <PlatformShell>
            {children}
          </PlatformShell>
        </div>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SiteNav } from './components/SiteNav'
import { SiteFooter } from './components/SiteFooter'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `${SITE.title} · ${SITE.titleCn}`,
  description: `${SITE.org} ${SITE.season} · GPU Kernel、分布式通信、LLM 推理与强化学习系统的系列研讨与课程日历。`,
  icons: { icon: '/favicon.svg' }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}

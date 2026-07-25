'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter } from 'next/navigation'

// HeroUI 的 Link/交互组件走 Next 客户端路由；next-themes 负责深浅色 class 切换。
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <HeroUIProvider navigate={router.push} locale="zh-CN">
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  )
}

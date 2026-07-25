'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'

// 极简主题切换：避免引入图标库，用字符表示当前模式。
export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current = mounted ? resolvedTheme ?? theme : undefined
  const isDark = current === 'dark'

  return (
    <Button
      isIconOnly
      radius="full"
      variant="light"
      size="sm"
      aria-label="切换深浅色"
      className="text-[var(--site-text-2)]"
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <span className="text-base leading-none" suppressHydrationWarning>
        {mounted ? (isDark ? '☾' : '☀') : '☀'}
      </span>
    </Button>
  )
}

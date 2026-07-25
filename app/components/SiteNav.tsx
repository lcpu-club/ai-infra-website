'use client'

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle
} from '@heroui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ThemeSwitch } from './ThemeSwitch'
import { SITE, docHref } from '@/lib/site'

interface NavLink {
  label: string
  href: string
  external?: boolean
}

const NAV_LINKS: NavLink[] = [
  { label: '首页', href: '/' },
  { label: '课程日历', href: '/calendar' },
  { label: '课程讲义', href: docHref('/sessions/01'), external: true },
  { label: 'Wiki', href: SITE.feishuWiki, external: true }
]

export function SiteNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Navbar
      maxWidth="xl"
      isMenuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      classNames={{
        base: 'border-b border-[var(--site-line)] bg-[var(--site-bg)]/85 backdrop-blur-md',
        wrapper: 'px-4 sm:px-6'
      }}
    >
      <NavbarContent justify="start">
        <NavbarMenuToggle className="sm:hidden" aria-label="菜单" />
        <NavbarBrand>
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-[var(--site-text)]">
              {SITE.title}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-[var(--site-text-3)]">
              {SITE.titleCn}
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-7 sm:flex" justify="center">
        {NAV_LINKS.map((link) => (
          <NavbarItem key={link.label} isActive={!link.external && isActive(link.href)}>
            {link.external ? (
              <a
                href={link.href}
                className="text-[13px] font-medium text-[var(--site-text-2)] transition-colors hover:text-[var(--site-brand)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className={`text-[13px] font-medium transition-colors hover:text-[var(--site-brand)] ${
                  isActive(link.href)
                    ? 'text-[var(--site-brand)]'
                    : 'text-[var(--site-text-2)]'
                }`}
              >
                {link.label}
              </Link>
            )}
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className="bg-[var(--site-bg)]/95 pt-6">
        {NAV_LINKS.map((link) => (
          <NavbarMenuItem key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                className="text-lg font-medium text-[var(--site-text)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className={`text-lg font-medium ${
                  isActive(link.href)
                    ? 'text-[var(--site-brand)]'
                    : 'text-[var(--site-text)]'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            )}
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}

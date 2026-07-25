import { SITE, docHref } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--site-line)] bg-[var(--site-surface-2)]">
      <div className="mx-auto flex w-[min(1140px,calc(100%-48px))] flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[var(--site-text-2)]">
            {SITE.title} · {SITE.season}
          </span>
          <span className="text-[12px] text-[var(--site-text-3)]">{SITE.org}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[var(--site-text-3)]">
          <a href={docHref('/sessions/01')} className="hover:text-[var(--site-brand)]">
            课程讲义
          </a>
          <a href={SITE.feishuWiki} className="hover:text-[var(--site-brand)]">
            飞书 Wiki
          </a>
          <a
            href="https://github.com/lcpu-club/ai-infra-website"
            className="hover:text-[var(--site-brand)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

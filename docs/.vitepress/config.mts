import { defineConfig, type DefaultTheme } from 'vitepress'
import feishuSnapshot from './data/generated/feishu.json'

interface WikiPage {
  wikiNodeToken: string
  parentWikiNodeToken: string | null
  title: string
  route: string
  order: number
}

interface WikiSnapshot {
  title: string
  pages: WikiPage[]
}

type LocaleKey = 'zh' | 'en'

const base = process.env.SITE_BASE ?? '/'
const wiki = (feishuSnapshot as { wiki?: WikiSnapshot }).wiki
const englishWikiTitles: Record<string, string> = {
  __root: 'AI Infra Seminars Wiki',
  VWJPwVFTHifeadkE4phc45hOntg: 'Topic 1 — Kernel and ML Compilers',
  F9oKw4GUgi30lQkgWScckzjfnfd:
    'Session 00 — From HPC to AI Infra: Parallel Computing',
  WHFXw13vEiD8Hikfp3ScU33JnXe: 'Session 01 — GPU Programming Model'
}

function localePath(route: string, locale: LocaleKey) {
  if (locale === 'zh') return route
  if (route === '/') return '/en/'
  return `/en${route}`
}

function wikiTitle(page: WikiPage, locale: LocaleKey) {
  if (locale === 'zh') return page.title
  return englishWikiTitles[page.wikiNodeToken] ?? page.title
}

function wikiItems(
  parentWikiNodeToken: string | null,
  locale: LocaleKey
): DefaultTheme.SidebarItem[] {
  return (wiki?.pages ?? [])
    .filter((page) => page.parentWikiNodeToken === parentWikiNodeToken)
    .sort((left, right) => left.order - right.order)
    .map((page) => {
      const items = wikiItems(page.wikiNodeToken, locale)
      return {
        text: wikiTitle(page, locale),
        link: localePath(page.route, locale),
        ...(items.length > 0 ? { items, collapsed: false } : {})
      }
    })
}

function wikiCourseItems(locale: LocaleKey): DefaultTheme.NavItem[] {
  return (wiki?.pages ?? [])
    .filter((page) => page.parentWikiNodeToken === null)
    .sort((left, right) => left.order - right.order)
    .map((page) => ({
      text: wikiTitle(page, locale),
      link: localePath(page.route, locale)
    }))
}

function footerMessage(locale: LocaleKey) {
  const names =
    locale === 'en'
      ? {
          lcpu: 'Linux Club of Peking Unversity',
          wmhpc: 'PKU Weiming Supercomputing Team',
          linuxproj: 'Linux.cn'
        }
      : {
          lcpu: '北京大学学生 Linux 俱乐部',
          wmhpc: '北京大学未名超算队',
          linuxproj: 'Linux 中国开源社区'
        }

  return (
    `<span class="footer-organization-logos">` +
    `<a href="https://lcpu.dev" target="_blank" rel="noreferrer" aria-label="${names.lcpu}">` +
    `<img class="footer-logo footer-logo-lcpu" src="${base}lcpu.svg" alt="${names.lcpu}">` +
    `</a>` +
    `<a href="https://hpc.pku.edu.cn/pkusc/zh-cn/" target="_blank" rel="noreferrer" aria-label="${names.wmhpc}">` +
    `<img class="footer-logo footer-logo-wmhpc" src="${base}wmhpc.png" alt="${names.wmhpc}">` +
    `</a>` +
    `<img class="footer-logo footer-logo-linuxproj" src="${base}linuxproj.svg" alt="${names.linuxproj}">` +
    `</span>`
  )
}

function footerCopyright(locale: LocaleKey) {
  const names =
    locale === 'en'
      ? {
          lcpu: 'Linux Club of Peking Unversity',
          wmhpc: 'PKU Weiming Supercomputing Team'
        }
      : {
          lcpu: '北京大学学生 Linux 俱乐部',
          wmhpc: '北京大学未名超算队'
        }

  return (
    `© 2026 <a href="https://lcpu.dev" target="_blank" rel="noreferrer">${names.lcpu}</a> · ` +
    `<a href="https://hpc.pku.edu.cn/pkusc/zh-cn/" target="_blank" rel="noreferrer">${names.wmhpc}</a> · ` +
    `Licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="license noreferrer">CC BY-NC-SA 4.0</a>`
  )
}

function themeConfig(locale: LocaleKey): DefaultTheme.Config {
  const english = locale === 'en'
  const courseItems = wikiCourseItems(locale)
  const wikiRoot = localePath('/wiki/', locale)

  return {
    logo: '/wmhpc.png',
    siteTitle: 'Infra Seminars',
    nav: [
      {
        text: english ? 'About' : '课程介绍',
        link: localePath('/', locale)
      },
      {
        text: english ? 'Schedule' : '活动日历',
        link: localePath('/schedule', locale)
      },
      ...(wiki
        ? [
            courseItems.length > 0
              ? {
                  text: english ? 'Course Materials' : '课程资料',
                  items: courseItems
                }
              : {
                  text: english ? 'Course Materials' : '课程资料',
                  link: wikiRoot
                }
          ]
        : [])
    ],
    sidebar: wiki
      ? {
          [wikiRoot]: [
            {
              text: english
                ? englishWikiTitles.__root
                : wiki.title,
              link: wikiRoot,
              collapsed: false,
              items: wikiItems(null, locale)
            }
          ]
        }
      : {},
    outline: {
      level: [2, 3],
      label: english ? 'On this page' : '本页目录'
    },
    search: {
      provider: 'local',
      options: english
        ? {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search course materials'
              },
              modal: {
                noResultsText: 'No results found',
                resetButtonTitle: 'Reset',
                footer: {
                  selectText: 'Select',
                  navigateText: 'Navigate',
                  closeText: 'Close'
                }
              }
            }
          }
        : {
            translations: {
              button: {
                buttonText: '搜索课程',
                buttonAriaLabel: '搜索课程'
              },
              modal: {
                noResultsText: '没有找到相关内容',
                resetButtonTitle: '清除',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
    },
    lastUpdated: {
      text: english ? 'Last updated' : '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
    docFooter: {
      prev: english ? 'Previous' : '上一节',
      next: english ? 'Next' : '下一节'
    },
    darkModeSwitchLabel: english ? 'Theme' : '主题',
    lightModeSwitchTitle: english ? 'Switch to light theme' : '切换到浅色模式',
    darkModeSwitchTitle: english ? 'Switch to dark theme' : '切换到深色模式',
    sidebarMenuLabel: english ? 'Menu' : '菜单',
    returnToTopLabel: english ? 'Return to top' : '返回顶部',
    langMenuLabel: english ? 'Change language' : '切换语言',
    skipToContentLabel: english ? 'Skip to content' : '跳到正文',
    footer: {
      message: footerMessage(locale),
      copyright: footerCopyright(locale)
    }
  }
}

function routeFromRelativePath(relativePath: string) {
  const withoutExtension = relativePath.replace(/\.md$/, '')
  const route = withoutExtension.replace(/(^|\/)index$/, '$1')
  return `${base}${route}`.replace(/\/{2,}/g, '/')
}

export default defineConfig({
  base,
  cleanUrls: true,
  appearance: true,
  lastUpdated: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Infra Seminars',
      description:
        'Weiming HPC Training Camp × LCPU AI Infra Seminars：从 Kernel 到分布式系统、推理与强化学习系统。',
      themeConfig: themeConfig('zh')
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Infra Seminars',
      description:
        'From kernels and ML compilers to communication, serving, and distributed reinforcement learning systems.',
      themeConfig: themeConfig('en')
    }
  },
  vite: {
    ssr: {
      noExternal: ['@schedule-x/vue']
    }
  },
  head: [
    [
      'meta',
      {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)'
      }
    ],
    [
      'meta',
      {
        name: 'theme-color',
        content: '#202228',
        media: '(prefers-color-scheme: dark)'
      }
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['link', { rel: 'icon', href: `${base}wmhpc.png`, type: 'image/png' }]
  ],
  transformHead({ pageData, title, description }) {
    const relativePath = pageData.relativePath
    const english = relativePath.startsWith('en/')
    const counterpart = english
      ? relativePath.slice(3)
      : `en/${relativePath}`

    return [
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      [
        'meta',
        {
          property: 'og:locale',
          content: english ? 'en_US' : 'zh_CN'
        }
      ],
      [
        'link',
        {
          rel: 'alternate',
          hreflang: english ? 'zh-CN' : 'en',
          href: routeFromRelativePath(counterpart)
        }
      ]
    ]
  }
})

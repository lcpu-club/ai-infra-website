import { defineConfig } from 'vitepress'
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

const base = '/ai-infra-website/'
const wiki = (feishuSnapshot as { wiki?: WikiSnapshot }).wiki
const wikiCourseItems = (wiki?.pages ?? [])
  .filter((page) => page.parentWikiNodeToken === null)
  .sort((left, right) => left.order - right.order)
  .map((page) => ({
    text: page.title,
    link: page.route
  }))
const wikiSidebarItems = (parentWikiNodeToken: string | null): any[] =>
  (wiki?.pages ?? [])
    .filter((page) => page.parentWikiNodeToken === parentWikiNodeToken)
    .sort((left, right) => left.order - right.order)
    .map((page) => {
      const items = wikiSidebarItems(page.wikiNodeToken)
      return {
        text: page.title,
        link: page.route,
        ...(items.length > 0 ? { items, collapsed: false } : {})
      }
    })

export default defineConfig({
  lang: 'zh-CN',
  title: 'Infra Seminars',
  base,
  description:
    'Weiming HPC Training Camp × LCPU AI Infra Seminars：从 Kernel 到分布式系统、推理与强化学习系统。',
  cleanUrls: true,
  appearance: true,
  lastUpdated: true,
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
        content: '#1b1b1f',
        media: '(prefers-color-scheme: dark)'
      }
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Infra Seminars 2026' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '从一行 Kernel，到一套大模型系统。七周、四个主题，一起把系统跑起来。'
      }
    ],
    ['link', { rel: 'icon', href: `${base}wmhpc.png`, type: 'image/png' }]
  ],
  themeConfig: {
    logo: '/wmhpc.png',
    siteTitle: 'Infra Seminars',
    nav: [
      { text: '课程介绍', link: '/' },
      { text: '活动日历', link: '/schedule' },
      ...(wiki
        ? [
            wikiCourseItems.length > 0
              ? { text: '课程资料', items: wikiCourseItems }
              : { text: '课程资料', link: '/wiki/' }
          ]
        : [])
    ],
    sidebar: {
      ...(wiki
        ? {
            '/wiki/': [
              {
                text: wiki.title,
                link: '/wiki/',
                collapsed: false,
                items: wikiSidebarItems(null)
              }
            ]
          }
        : {})
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    search: {
      provider: 'local',
      options: {
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
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
    docFooter: {
      prev: '上一节',
      next: '下一节'
    },
    footer: {
      message:
        `<span class="footer-organization-logos">` +
        `<a href="https://lcpu.dev" target="_blank" rel="noreferrer" aria-label="北京大学学生 Linux 俱乐部官网">` +
        `<img class="footer-logo footer-logo-lcpu" src="${base}lcpu.svg" alt="北京大学学生 Linux 俱乐部标志">` +
        `</a>` +
        `<a href="https://hpc.pku.edu.cn/pkusc/zh-cn/" target="_blank" rel="noreferrer" aria-label="北京大学未名超算队官网">` +
        `<img class="footer-logo footer-logo-wmhpc" src="${base}wmhpc.png" alt="北京大学未名超算队标志">` +
        `</a>` +
        `<img class="footer-logo footer-logo-linuxproj" src="${base}linuxproj.svg" alt="Linux 中国开源社区标志">` +
        `</span>`,
      copyright:
        '© 2026 <a href="https://lcpu.dev" target="_blank" rel="noreferrer">北京大学学生 Linux 俱乐部</a> · <a href="https://hpc.pku.edu.cn/pkusc/zh-cn/" target="_blank" rel="noreferrer">北京大学未名超算队</a> · Licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="license noreferrer">CC BY-NC-SA 4.0</a>'
    }
  }
})

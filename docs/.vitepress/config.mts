import { defineConfig } from 'vitepress'
import { sessions, topics } from './data/program'
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
const firstPublishedSession = sessions.find(({ href }) => href)
const wiki = (feishuSnapshot as { wiki?: WikiSnapshot }).wiki
const sessionSidebar = topics.map((topic) => ({
  text: `Topic ${topic.number} · ${topic.title}`,
  collapsed: topic.number !== '01',
  items: sessions
    .filter((session) => session.topic === topic.key && session.href)
    .map((session) => ({
      text: `${session.id} · ${session.title}`,
      link: session.href!
    }))
})).filter(({ items }) => items.length > 0)
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
  title: 'AI Infra Seminars',
  base,
  description:
    'Weiming HPC Training Camp × LCPU AI Infra Seminars：从 Kernel 到分布式系统、推理与强化学习系统。',
  cleanUrls: true,
  appearance: true,
  lastUpdated: true,
  head: [
    [
      'meta',
      {
        name: 'theme-color',
        content: '#fbfaf9',
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
    ['meta', { property: 'og:title', content: 'AI Infra Seminars 2026' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '从一行 Kernel，到一套大模型系统。七周、四个 Topic，一起把系统跑起来。'
      }
    ],
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }]
  ],
  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'AI Infra Seminars',
    nav: [
      { text: '课程介绍', link: '/' },
      { text: '活动日历', link: '/schedule' },
      ...(wiki ? [{ text: wiki.title, link: '/wiki/' }] : []),
      ...(firstPublishedSession
        ? [
            {
              text: `Session ${firstPublishedSession.id}`,
              link: firstPublishedSession.href!
            }
          ]
        : []),
      {
        text: '课程资料',
        items: [
          ...(wiki ? [{ text: wiki.title, link: '/wiki/' }] : []),
          ...sessions
            .filter(({ href }) => href)
            .map((session) => ({
              text: session.title,
              link: session.href!
            })),
          { text: '完整活动日历', link: '/schedule#full-schedule' }
        ]
      }
    ],
    sidebar: {
      '/sessions/': sessionSidebar,
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
      message: '课程资料将持续整理并开源共享',
      copyright:
        'Weiming HPC Training Camp × LCPU AI Infra Seminars'
    }
  }
})

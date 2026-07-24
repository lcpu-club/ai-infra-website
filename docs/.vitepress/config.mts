import { defineConfig } from 'vitepress'

const base = '/ai-infra-website/'

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
        content: '#111318',
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
      { text: '课程日程', link: '/schedule' },
      { text: 'Session 01', link: '/sessions/01' },
      {
        text: '课程资料',
        items: [
          { text: 'GPU & GPU Programming', link: '/sessions/01' },
          { text: '完整课程日程', link: '/schedule#full-schedule' }
        ]
      }
    ],
    sidebar: {
      '/sessions/': [
        {
          text: 'Topic 01 · Kernel & Compiler',
          collapsed: false,
          items: [
            {
              text: '01 · GPU & GPU Programming',
              link: '/sessions/01'
            },
            {
              text: '02 · Memory Abstraction',
              link: '/schedule#session-02'
            },
            {
              text: '03 · Tensor Core',
              link: '/schedule#session-03'
            },
            {
              text: '04 · Pipeline Ordering',
              link: '/schedule#session-04'
            },
            {
              text: '05 · DSL & ML Compiler',
              link: '/schedule#session-05'
            },
            {
              text: '06 · Hardware & SoL Kernel',
              link: '/schedule#session-06'
            }
          ]
        },
        {
          text: '其他 Topic',
          items: [
            { text: '完整课程日程', link: '/schedule' }
          ]
        }
      ]
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

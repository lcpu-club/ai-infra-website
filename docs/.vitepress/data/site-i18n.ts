import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { CalendarEvent, Topic } from './program'

export type SiteLocale = 'zh' | 'en'

const topicTranslations: Record<Topic['key'], Omit<Topic, 'key' | 'number'>> = {
  kernel: {
    title: 'Kernel & ML Compiler',
    shortTitle: 'Kernel & Operator',
    description:
      'Start with GPU architecture and CUDA, then follow layout, data reuse, and pipelining through high-performance GEMM, Attention, and MoE kernels. Along the way, see how DSLs and ML compilers make performance engineering more productive and increasingly automatic.',
    tags: [
      'CUDA',
      'Triton',
      'TileLang',
      'Tensor Core',
      'Warp Specialization',
      'Pipeline Ordering',
      'ML Compiler'
    ]
  },
  comm: {
    title: 'Interconnect & Communication',
    shortTitle: 'Communication',
    description:
      'Study interconnects and collective communication from multiple layers, and understand how they determine the real efficiency of large-scale AI systems.',
    tags: [
      'RDMA',
      'NCCL',
      'Scale-Up',
      'Scale-Out',
      'Network Fabric',
      'Memory-Storage Co-design'
    ]
  },
  serving: {
    title: 'LLM Serving & Inference',
    shortTitle: 'Serving',
    description:
      'Use KV cache, scheduling, and parallelism as the main threads for understanding inference optimization, then connect those ideas to the architecture of real serving systems.',
    tags: [
      'KV Cache Centric Systems',
      'Batching',
      'Prefill-Decode Disaggregation',
      'Speculative Decoding',
      'vLLM'
    ]
  },
  rl: {
    title: 'Distributed Reinforcement Learning Systems',
    shortTitle: 'RL Systems',
    description:
      'When training, inference, rewards, and environments all run together, learn to reason about tail latency, resource scheduling, weight synchronization, fault tolerance, and training-inference consistency as one system.',
    tags: [
      'PPO',
      'veRL',
      'Rollout',
      'Agentic RL',
      'Training-Inference Consistency',
      'Distributed RL Systems'
    ]
  }
}

const eventTranslations: Record<
  string,
  Partial<
    Pick<
      CalendarEvent,
      'summary' | 'description' | 'location' | 'timeLabel' | 'speakers'
    >
  >
> = {
  'f998aa77-12f5-4f85-99c5-6503c58c2144_0': {
    summary: 'Topic 1: Kernel & ML Compiler — First Seminar',
    description:
      'Session 00 | From HPC to AI Infra: Parallel Computing and Parallel Programming\n' +
      'Session 01 | GPU Programming Model\n' +
      'Seminar overview, curriculum design, evaluation, and computing resources',
    location: 'Tencent Meeting · Bilibili Live',
    speakers: ['Jiajun Chen', 'Yi Zheng', 'Yifei Wang']
  }
}

export const siteCopy = {
  zh: {
    home: {
      organizationsAria: '北京大学未名超算队与北京大学学生 Linux 俱乐部',
      wmhpc: '北京大学未名超算队',
      lcpu: '北京大学学生 Linux 俱乐部',
      subtitle: '大模型如何训更快、跑更好、推更省？',
      lead:
        '从 Kernel 到编译器、从分布式系统到集合通信、从模型推理到强化学习系统，社团骨干与超算队倾力设计打造课程设计，力求向你揭示工业界大规模模型训练与推理的最前沿！',
      scheduleButton: '查看课程日历',
      materialsButton: '浏览课程资料',
      upcoming: '近期安排',
      openCalendar: '打开课程日历 →',
      calendarEvent: '日历活动',
      yearSuffix: '年',
      noUpcoming: '近期暂无公开安排',
      stayTuned: '敬请期待',
      topicsTitle: '四个 Topics，四个 Level',
      keywords: '关键词',
      formatTitle: '如何进行',
      supportAria: '支持单位与版权信息',
      sponsorsTitle: '赞助商',
      partnersTitle: '合作伙伴',
      coOrganizers: '联合发起',
      visitWebsite: '访问官网',
      logoSuffix: '标志'
    },
    formatSteps: [
      ['01', '主题分享', '每场围绕一个系统主题，由专业同学进行系统讲解和分享。'],
      ['02', '现场讨论', '分享后开放提问与延伸讨论，串联论文、源码与真实工程经验。'],
      ['03', 'Guest Lecture', '邀请业界专家进行专题讲座，分享前沿技术与实践经验。'],
      [
        '04',
        '代码实践',
        '结合 CUDA、TileLang 与训推框架，提供高质量的作业练习、评测环境与测试实例。'
      ],
      ['05', '资料开源', '讲义与资料统一同步开源，持续更新。']
    ],
    schedule: {
      title: '课程日历',
      firstEvent: '回到首场活动',
      allEvents: '全部安排',
      calendarAria: '交互式课程日历',
      loading: '正在加载交互日历…',
      loadingHint: '上方日程列表会始终保留。',
      headers: ['日期', '安排', '活动内容', '讲者', '作业', '时间'],
      phases: {
        upcoming: '待开始',
        ongoing: '进行中',
        ended: '已结束'
      },
      dateRangeSeparator: '至',
      noDescription: '暂无活动说明',
      speakerTbd: '待定',
      emptyTitle: '共享日历中暂时没有活动',
      emptyDescription:
        '在 AI Infra 共享日历中新建日程后，网站会在下一次同步时自动更新。',
      statuses: {
        cancelled: '已取消',
        confirmed: '已确认',
        tentative: '待确认'
      },
      dialogClose: '关闭日程详情',
      location: '地点',
      viewNotes: '查看讲义',
      joinMeeting: '进入会议 ↗',
      sourceCalendar: '飞书日历 ↗'
    },
    session: {
      topic: '主题',
      lecture: '讲',
      statuses: {
        cancelled: '已取消',
        ended: '已结束',
        today: '今天',
        upcoming: '即将开始'
      },
      status: '状态',
      speakers: '分享',
      location: '地点',
      format: '形式',
      formatValue: '预习 + 分享 + 讨论',
      joinMeeting: '加入会议 ↗'
    }
  },
  en: {
    home: {
      organizationsAria:
        'PKU Weiming Supercomputing Team and Linux Club of Peking Unversity',
      wmhpc: 'PKU Weiming Supercomputing Team',
      lcpu: 'Linux Club of Peking Unversity',
      subtitle: 'How can we train faster, run better, and serve for less?',
      lead:
        'From kernels and compilers to distributed systems and collective communication, and from model serving to reinforcement learning systems, this seminar series connects the ideas and engineering behind large-scale AI training and inference.',
      scheduleButton: 'View schedule',
      materialsButton: 'Browse course materials',
      upcoming: 'Upcoming events',
      openCalendar: 'Open full calendar →',
      calendarEvent: 'Seminar',
      yearSuffix: '',
      noUpcoming: 'No public events scheduled yet',
      stayTuned: 'More sessions are on the way.',
      topicsTitle: 'Four Topics, Four Levels',
      keywords: 'keywords',
      formatTitle: 'How It Works',
      supportAria: 'Sponsors, partners, organizers, and copyright',
      sponsorsTitle: 'Sponsors',
      partnersTitle: 'Partners',
      coOrganizers: 'Co-organized by',
      visitWebsite: 'Visit website',
      logoSuffix: ' logo'
    },
    formatSteps: [
      [
        '01',
        'Technical Talks',
        'Each seminar focuses on one systems topic and builds a structured understanding from fundamentals to practice.'
      ],
      [
        '02',
        'Open Discussion',
        'Questions and follow-up discussions connect papers, source code, and real engineering experience.'
      ],
      [
        '03',
        'Guest Lectures',
        'Industry experts share current techniques, systems, and lessons learned in production.'
      ],
      [
        '04',
        'Hands-on Practice',
        'Exercises, evaluation environments, and test cases cover CUDA, TileLang, training, and serving frameworks.'
      ],
      [
        '05',
        'Open Materials',
        'Slides, notes, and supporting materials are published openly and updated throughout the series.'
      ]
    ],
    schedule: {
      title: 'Seminar Schedule',
      firstEvent: 'Jump to the first event',
      allEvents: 'All Events',
      calendarAria: 'Interactive seminar calendar',
      loading: 'Loading the interactive calendar…',
      loadingHint: 'The event list above will remain available.',
      headers: ['Date', 'Event', 'Program', 'Speakers', 'Assignment', 'Time'],
      phases: {
        upcoming: 'Upcoming',
        ongoing: 'Live',
        ended: 'Ended'
      },
      dateRangeSeparator: 'to',
      noDescription: 'No description',
      speakerTbd: 'TBA',
      emptyTitle: 'There are no events on the shared calendar yet',
      emptyDescription:
        'Events added to the shared AI Infra calendar will appear here after the next sync.',
      statuses: {
        cancelled: 'Cancelled',
        confirmed: 'Confirmed',
        tentative: 'Tentative'
      },
      dialogClose: 'Close event details',
      location: 'Location',
      viewNotes: 'View notes',
      joinMeeting: 'Join meeting ↗',
      sourceCalendar: 'Feishu Calendar ↗'
    },
    session: {
      topic: 'Topic',
      lecture: 'Session',
      statuses: {
        cancelled: 'Cancelled',
        ended: 'Ended',
        today: 'Today',
        upcoming: 'Upcoming'
      },
      status: 'Status',
      speakers: 'Speakers',
      location: 'Location',
      format: 'Format',
      formatValue: 'Preparation + Talk + Discussion',
      joinMeeting: 'Join meeting ↗'
    }
  }
} as const

export function useSiteLocale() {
  const { lang } = useData()
  const locale = computed<SiteLocale>(() =>
    lang.value.toLowerCase().startsWith('en') ? 'en' : 'zh'
  )
  const copy = computed(() => siteCopy[locale.value])
  const isEnglish = computed(() => locale.value === 'en')

  function localePath(path: string) {
    if (!path.startsWith('/') || /^https?:\/\//.test(path)) return path
    if (!isEnglish.value) return path
    if (path === '/') return '/en/'
    return `/en${path}`
  }

  function href(path: string) {
    if (/^https?:\/\//.test(path)) return path
    return withBase(localePath(path))
  }

  return { locale, copy, isEnglish, localePath, href }
}

export function localizedTopics(
  topics: Topic[],
  locale: SiteLocale
): Topic[] {
  if (locale === 'zh') return topics
  return topics.map((topic) => ({
    key: topic.key,
    number: topic.number,
    ...topicTranslations[topic.key]
  }))
}

export function localizeCalendarEvent(
  event: CalendarEvent,
  locale: SiteLocale
): CalendarEvent {
  if (locale === 'zh') return event
  return {
    ...event,
    ...eventTranslations[event.eventId],
    assignment: event.assignment
      ? {
          ...event.assignment,
          title:
            event.assignment.title === '作业'
              ? 'Assignment'
              : event.assignment.title
        }
      : undefined
  }
}

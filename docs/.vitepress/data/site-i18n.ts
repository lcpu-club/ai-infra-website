import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { Topic } from './program'

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
      registrationButton: '立即报名 ↗',
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
      calendarView: '日历视图',
      calendarAria: '交互式课程日历',
      loading: '正在加载交互日历…',
      loadingHint: '上方日程列表会始终保留。',
      headers: [
        '日期 / 时间',
        '活动',
        '内容提要',
        '主讲',
        '课程材料 / 作业'
      ],
      phases: {
        upcoming: '待开始',
        ongoing: '进行中',
        ended: '已结束'
      },
      dateRangeSeparator: '至',
      noDescription: '暂无活动说明',
      expandContent: '展开完整内容',
      collapseContent: '收起完整内容',
      speakerTbd: '待定',
      emptyTitle: '暂时没有公开活动',
      emptyDescription:
        '在 content/schedule.yaml 中添加活动后，网站会在下一次构建时自动更新。',
      downloadCalendar: '下载课程日历 (.ics)',
      eventTypes: {
        lecture: '课程讲座',
        guestLecture: '嘉宾讲座',
        assignment: '作业 DDL'
      },
      statuses: {
        cancelled: '已取消',
        confirmed: '已确认',
        tentative: '待确认'
      },
      dialogClose: '关闭日程详情',
      location: '地点',
      viewNotes: '查看讲义',
      joinMeeting: '进入会议 ↗',
      assignments: '查看作业'
    },
    assignments: {
      title: '作业清单',
      headers: ['ID', '作业', '关联活动', '发布时间', '截止时间', '状态'],
      phases: {
        upcoming: '未发布',
        open: '进行中',
        ended: '已截止',
        noDeadline: '无截止时间'
      },
      noRelease: '发布即生效',
      noDue: '待公布',
      noEvents: '未关联活动',
      emptyTitle: '暂未发布作业',
      emptyDescription:
        '在 content/assignments.yaml 中添加作业，并在日程里引用其 ID。',
      downloadDeadlines: '下载作业 DDL (.ics)'
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
      formatValue: '预习 + 分享 + 讨论'
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
      registrationButton: 'Register now ↗',
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
      calendarView: 'Calendar',
      calendarAria: 'Interactive seminar calendar',
      loading: 'Loading the interactive calendar…',
      loadingHint: 'The event list above will remain available.',
      headers: [
        'Date / time',
        'Event',
        'Summary',
        'Speakers',
        'Materials / assignments'
      ],
      phases: {
        upcoming: 'Upcoming',
        ongoing: 'Live',
        ended: 'Ended'
      },
      dateRangeSeparator: 'to',
      noDescription: 'No description',
      expandContent: 'Show full description',
      collapseContent: 'Collapse description',
      speakerTbd: 'TBA',
      emptyTitle: 'There are no public events yet',
      emptyDescription:
        'Add events to content/schedule.yaml and rebuild the site.',
      downloadCalendar: 'Download course calendar (.ics)',
      eventTypes: {
        lecture: 'Lecture',
        guestLecture: 'Guest Lecture',
        assignment: 'Assignment deadline'
      },
      statuses: {
        cancelled: 'Cancelled',
        confirmed: 'Confirmed',
        tentative: 'Tentative'
      },
      dialogClose: 'Close event details',
      location: 'Location',
      viewNotes: 'View notes',
      joinMeeting: 'Join meeting ↗',
      assignments: 'View assignments'
    },
    assignments: {
      title: 'Assignments',
      headers: [
        'ID',
        'Assignment',
        'Related events',
        'Release',
        'Deadline',
        'Status'
      ],
      phases: {
        upcoming: 'Not released',
        open: 'Open',
        ended: 'Closed',
        noDeadline: 'No deadline'
      },
      noRelease: 'Available immediately',
      noDue: 'TBA',
      noEvents: 'No related event',
      emptyTitle: 'No assignments have been published yet',
      emptyDescription:
        'Add an assignment to content/assignments.yaml and reference its ID from an event.',
      downloadDeadlines: 'Download assignment deadlines (.ics)'
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
      formatValue: 'Preparation + Talk + Discussion'
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

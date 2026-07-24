import feishuSnapshot from './generated/feishu.json'

export type TopicKey = 'kernel' | 'comm' | 'serving' | 'rl'

export interface Topic {
  key: TopicKey
  number: string
  title: string
  shortTitle: string
  description: string
  tags: string[]
}

export interface Session {
  id: string
  date: string
  dateLabel: string
  week: string
  topic: TopicKey
  eyebrow: string
  title: string
  items: string[]
  owners: string[]
  href?: string
  note?: string
  startAt?: string
  endAt?: string
  timeLabel?: string
  location?: string
  meetingUrl?: string
  calendarStatus?: 'tentative' | 'confirmed' | 'cancelled'
}

export const topics: Topic[] = [
  {
    key: 'kernel',
    number: '01',
    title: 'Kernel & ML Compiler',
    shortTitle: 'Kernel',
    description:
      '从 GPU 体系结构与 CUDA 出发，沿着 Layout、数据复用和流水线一路抵达高性能 GEMM、Attention 与 MoE Kernel。',
    tags: ['CUDA', 'Triton', 'TileLang', 'Tensor Core']
  },
  {
    key: 'comm',
    number: '02',
    title: 'Distributed Parallelism & Communication',
    shortTitle: 'Communication',
    description:
      '理解模型如何跨卡切分、数据如何流动，以及互联网络与集合通信如何决定大规模系统的真实效率。',
    tags: ['RDMA', 'NCCL', 'All-Reduce', 'MoE']
  },
  {
    key: 'serving',
    number: '03',
    title: 'LLM Serving & Inference',
    shortTitle: 'Serving',
    description:
      '围绕 KV Cache、调度与并行策略，拆解一批长短不一的请求如何共享有限 GPU 并保持低延迟。',
    tags: ['KV Cache', 'Batching', 'PD Disaggregation', 'Spec Decode']
  },
  {
    key: 'rl',
    number: '04',
    title: 'Distributed Reinforcement Learning Systems',
    shortTitle: 'RL Systems',
    description:
      '当训练、推理、奖励与环境同时出现，系统如何解决长尾、资源调度、权重同步、容错与训推一致性。',
    tags: ['PPO', 'veRL', 'Rollout', 'Agentic RL']
  }
]

const staticSessions: Session[] = [
  {
    id: '01',
    date: '2026-07-23',
    dateLabel: '07.23',
    week: '第一周',
    topic: 'kernel',
    eyebrow: 'GPU & GPU PROGRAMMING',
    title: 'GPU 与 GPU 编程模型',
    items: [
      'MLSys on GPU：SIMD / SIMT、throughput vs latency',
      'CUDA：grid / block / thread、warp、host / device',
      'Triton / TileLang：CTA-level 与 tile abstraction'
    ],
    owners: ['超算队同学'],
    href: '/sessions/01'
  },
  {
    id: '02',
    date: '2026-07-26',
    dateLabel: '07.26',
    week: '第一周',
    topic: 'kernel',
    eyebrow: 'MEMORY ABSTRACTION',
    title: '让数据离计算更近',
    items: [
      'Roofline intuition 与 GPU memory hierarchy',
      'GEMM tiling 与 shared-memory data reuse',
      'Coalescing、bank conflict、padding 与 swizzle'
    ],
    owners: ['周宇轩']
  },
  {
    id: '03',
    date: '2026-07-30',
    dateLabel: '07.30',
    week: '第二周',
    topic: 'kernel',
    eyebrow: 'TENSOR CORE',
    title: 'Tensor Core 与 Layout',
    items: [
      'MMA tile shape 与 CUDA Core 对比',
      'Operand fragment 与 A / B / C Layout',
      'CuTe Layout Algebra 与 shared-memory swizzle'
    ],
    owners: ['孙远航', '周宇轩']
  },
  {
    id: '04',
    date: '2026-08-02',
    dateLabel: '08.02',
    week: '第二周',
    topic: 'kernel',
    eyebrow: 'PIPELINE ORDERING',
    title: '从 Double Buffer 到 Warp Specialization',
    items: [
      'Multi-buffer 与 dependence distance',
      'TMA：硬件异步数据搬运',
      'Producer / consumer warpgroup'
    ],
    owners: ['孙远航', '周宇轩']
  },
  {
    id: '05',
    date: '2026-08-06',
    dateLabel: '08.06',
    week: '第三周',
    topic: 'kernel',
    eyebrow: 'DSL & ML COMPILER',
    title: 'GPU DSL 与 ML Compiler',
    items: [
      'DSL 的第一性问题：What、Why、How',
      'GPU DSL 与 ML Compiler 的演进',
      'Auto pipelining、fusion 与 graph compiler'
    ],
    owners: ['周宇轩']
  },
  {
    id: '06',
    date: '2026-08-09',
    dateLabel: '08.09',
    week: '第三周',
    topic: 'kernel',
    eyebrow: 'HARDWARE & SOL KERNEL',
    title: '硬件演进与 SoL Kernel 拆解',
    items: [
      '从 Volta 到 Blackwell',
      'NPU 与领域专用加速器',
      'SoL GEMM / Attention Explained'
    ],
    owners: ['周宇轩', '孙远航']
  },
  {
    id: '07',
    date: '2026-08-13',
    dateLabel: '08.13',
    week: '第四周',
    topic: 'comm',
    eyebrow: 'COMMUNICATION HARDWARE',
    title: '从电路到现代计算系统',
    items: [
      'From Circuits to Modern Computing Systems',
      'A unified, forward-looking perspective'
    ],
    owners: ['AnterX'],
    note: '专题分享'
  },
  {
    id: '08',
    date: '2026-08-16',
    dateLabel: '08.16',
    week: '第四周',
    topic: 'comm',
    eyebrow: 'COMMUNICATION STACK',
    title: '通信硬件、软件栈与优化',
    items: [
      'Scale-up / Scale-out、NIC、Switch 与拓扑',
      'Collective、P2P、EP 与 MoE Communication',
      'Compute–Communication Overlap 与协同设计'
    ],
    owners: ['孔昊然']
  },
  {
    id: '09',
    date: '2026-08-20',
    dateLabel: '08.20',
    week: '第五周',
    topic: 'serving',
    eyebrow: 'SERVING FUNDAMENTALS',
    title: '推理系统的目标、指标与 PD 分离',
    items: [
      '目标、指标与 benchmark',
      'Prefill / Decode 计算过程',
      'PD 分离的动机与系统设计'
    ],
    owners: ['孙远航']
  },
  {
    id: '10',
    date: '2026-08-23',
    dateLabel: '08.23',
    week: '第五周',
    topic: 'serving',
    eyebrow: 'CACHE & BATCHING',
    title: '以 KV Cache 为核心的系统',
    items: [
      'KV Cache 的显存成本',
      'Paged / Prefix / Radix Cache',
      'Continuous Batching 与调度'
    ],
    owners: ['孙远航']
  },
  {
    id: '11',
    date: '2026-08-27',
    dateLabel: '08.27',
    week: '第六周',
    topic: 'serving',
    eyebrow: 'KERNEL & SPECULATION',
    title: 'Attention、MoE 与投机解码',
    items: [
      '推理 Kernel：Attention 与 MoE',
      'MTP 与 Speculative Decoding',
      '吞吐、延迟与接受率'
    ],
    owners: ['孙远航']
  },
  {
    id: '12',
    date: '2026-08-30',
    dateLabel: '08.30',
    week: '第六周',
    topic: 'serving',
    eyebrow: 'PARALLELISM & FRAMEWORKS',
    title: '推理并行与框架演进',
    items: [
      '常见推理并行策略',
      '主流 Serving Framework',
      '当下推理系统的演进方向'
    ],
    owners: ['孙远航']
  },
  {
    id: '13',
    date: '2026-09-03',
    dateLabel: '09.03',
    week: '第七周',
    topic: 'rl',
    eyebrow: 'DISTRIBUTED RL',
    title: '算法、框架与长尾问题',
    items: [
      'PPO、XXPO 与 OPD',
      'OpenRLHF、veRL 框架演进',
      '请求调度、资源分配与异步化'
    ],
    owners: ['黄翟']
  },
  {
    id: '14',
    date: '2026-09-06',
    dateLabel: '09.06',
    week: '第七周',
    topic: 'rl',
    eyebrow: 'AGENTIC RL SYSTEMS',
    title: '面向 Agentic RL 的系统工程',
    items: [
      '面向 Rollout 的投机解码',
      '训推一致性、训练稳定性与容错',
      '环境、沙箱与异构硬件'
    ],
    owners: ['黄翟']
  }
]

interface SyncedSession {
  calendar?: {
    summary?: string
    date?: string
    startAt?: string
    endAt?: string
    timeLabel?: string
    location?: string
    meetingUrl?: string
    status?: 'tentative' | 'confirmed' | 'cancelled'
  }
  document?: {
    wikiNodeToken: string
  }
}

const syncedSessions = feishuSnapshot.sessions as Record<string, SyncedSession>

export const sessions: Session[] = staticSessions.map((session) => {
  const synced = syncedSessions[session.id]
  const calendar = synced?.calendar
  const date = calendar?.date || session.date

  return {
    ...session,
    date,
    dateLabel: date.slice(5).replace('-', '.'),
    title: calendar?.summary || session.title,
    href: synced?.document ? `/sessions/${session.id}` : session.href,
    startAt: calendar?.startAt,
    endAt: calendar?.endAt,
    timeLabel: calendar?.timeLabel,
    location: calendar?.location,
    meetingUrl: calendar?.meetingUrl,
    calendarStatus: calendar?.status
  }
})

export function topicFor(key: TopicKey): Topic {
  return topics.find((topic) => topic.key === key) ?? topics[0]
}

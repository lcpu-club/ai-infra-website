import type { Metadata } from 'next'
import { Button, Card, CardBody, CardHeader, Chip, Link } from '@heroui/react'
import {
  calendarEvents,
  sessions,
  topics,
  type TopicKey
} from '@/docs/.vitepress/data/program'
import { BASE_PATH, SITE, docHref } from '@/lib/site'

export const metadata: Metadata = {
  title: `${SITE.title} · ${SITE.titleCn}`
}

const FACTS = [
  { label: 'SESSIONS', value: `${sessions.length} 场系列研讨` },
  { label: 'TOPICS', value: `${topics.length} 大主题方向` },
  { label: 'SEASON', value: SITE.season }
]

const FORMAT_STEPS = [
  { no: '01', title: '主题分享', desc: '每场围绕一个系统主题，由队内同学系统讲解核心原理与工程取舍。' },
  { no: '02', title: '现场讨论', desc: '分享后开放提问与延伸讨论，串联论文、源码与真实工程经验。' },
  { no: '03', title: '代码实践', desc: '结合 CUDA / Triton / 推理框架等，给出可复现的动手环节与示例。' },
  { no: '04', title: '讲义沉淀', desc: '讲义与资料统一沉淀到飞书 Wiki，持续更新、长期可查。' }
]

const topicColor: Record<TopicKey, 'primary' | 'secondary' | 'success' | 'warning'> = {
  kernel: 'primary',
  comm: 'warning',
  serving: 'success',
  rl: 'secondary'
}

// 首页直接读取同步 Action 写入 program.ts 的课程与公开日程。
const schedulePreview = [
  ...sessions.map((session) => ({
    key: `session-${session.id}`,
    date: session.date,
    title: session.title,
    href: session.href,
    topic: session.topic,
    label: '课程分享'
  })),
  ...calendarEvents
    .filter((event) => !event.sessionId)
    .map((event) => ({
      key: `event-${event.eventId}`,
      date: event.date,
      title: event.summary,
      href: event.href,
      topic: undefined as TopicKey | undefined,
      label: '日历活动'
    }))
].sort((left, right) => left.date.localeCompare(right.date)).slice(0, 5)

export default function HomePage() {
  return (
    <div className="mx-auto w-[min(1140px,calc(100%-48px))] py-16 sm:py-24">
      <section className="max-w-4xl">
        <Chip color="primary" variant="flat">{SITE.org}</Chip>
        <h1 className="mt-5 text-5xl font-bold text-foreground sm:text-6xl">AI Infrastructure Seminars</h1>
        <p className="mt-3 text-xl font-semibold text-primary sm:text-2xl">从 GPU Kernel 到分布式训推系统的系列研讨</p>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-foreground-500">
          面向对 AI 系统底层感兴趣的同学，沿着 Kernel 与编译器、分布式并行与通信、
          LLM 推理，以及分布式强化学习系统四条主线，构建一套可动手、可复现的知识路径。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button as="a" href={`${BASE_PATH}/calendar/`} color="primary">查看课程日历</Button>
          <Button as="a" href={docHref('/sessions/01')} variant="bordered">浏览课程讲义</Button>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <Card key={fact.label} shadow="sm">
            <CardBody className="gap-1">
              <p className="font-mono-label text-[11px] text-foreground-500">{fact.label}</p>
              <p className="text-[14px] font-semibold text-foreground">{fact.value}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <section className="mt-20">
        <Chip color="primary" variant="flat">TOPICS</Chip>
        <h2 className="mt-3 text-3xl font-bold text-foreground">四条主线，一套系统视角</h2>
        <div className="mt-8 grid gap-4">
          {topics.map((topic) => (
            <Card key={topic.key} shadow="sm">
              <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-[72px_280px_minmax(0,1fr)]">
                <Chip size="sm" color={topicColor[topic.key]} variant="flat" className="w-fit">{topic.number}</Chip>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{topic.title}</h3>
                  <p className="mt-1 text-sm text-foreground-500">{topic.shortTitle}</p>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-foreground-600">{topic.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topic.tags.map((tag) => (
                      <Chip key={tag} size="sm" color={topicColor[topic.key]} variant="flat">{tag}</Chip>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <Chip color="primary" variant="flat">FORMAT</Chip>
        <h2 className="mt-3 text-3xl font-bold text-foreground">如何进行</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMAT_STEPS.map((step) => (
            <Card key={step.no} shadow="sm">
              <CardBody>
                <Chip size="sm" color="primary" variant="flat" className="w-fit">{step.no}</Chip>
                <h3 className="mt-3 text-[15px] font-bold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-500">{step.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip color="primary" variant="flat">SCHEDULE</Chip>
            <h2 className="mt-3 text-3xl font-bold text-foreground">近期安排</h2>
          </div>
          <Button as="a" href={`${BASE_PATH}/calendar/`} color="primary" variant="light">打开完整日历</Button>
        </div>
        <div className="mt-8 grid gap-3">
          {schedulePreview.map((item) => {
            const [year, month, day] = item.date.split('-').map(Number)
            const href = item.href ? docHref(item.href) : `${BASE_PATH}/calendar/`
            return (
              <Link key={item.key} href={href} className="block max-w-none text-inherit">
                <Card isPressable shadow="sm" className="w-full">
                  <CardHeader className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-4">
                    <div>
                      <p className="font-mono-label text-base font-bold text-foreground">{month}.{`${day}`.padStart(2, '0')}</p>
                      <p className="text-[11px] text-foreground-500">{year} 年</p>
                    </div>
                    <div>
                      <Chip size="sm" color={item.topic ? topicColor[item.topic] : 'default'} variant="flat">{item.label}</Chip>
                      <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

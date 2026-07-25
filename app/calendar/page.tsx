'use client'

import { useState } from 'react'
import {
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@heroui/react'
import { CalendarDate } from '@internationalized/date'
import {
  calendarEvents,
  sessions,
  type CalendarStatus,
  type TopicKey
} from '@/docs/.vitepress/data/program'
import { SITE, docHref } from '@/lib/site'

type ScheduleItem = {
  key: string
  date: string
  title: string
  kind: 'session' | 'event'
  topic?: TopicKey
  timeLabel?: string
  owners?: string[]
  description?: string
  location?: string
  meetingUrl?: string
  href?: string
  sourceUrl?: string
  status?: CalendarStatus
}

// 直接消费 GitHub Action 同步进 program.ts 的公开日程快照。
const scheduleItems: ScheduleItem[] = [
  ...sessions.map((session) => ({
    key: `session-${session.id}`,
    date: session.date,
    title: session.title,
    kind: 'session' as const,
    topic: session.topic,
    timeLabel: session.timeLabel,
    owners: session.owners,
    location: session.location,
    meetingUrl: session.meetingUrl,
    href: session.href,
    status: session.calendarStatus
  })),
  ...calendarEvents
    .filter((event) => !event.sessionId)
    .map((event) => ({
      key: `event-${event.eventId}`,
      date: event.date,
      title: event.summary,
      kind: 'event' as const,
      timeLabel: event.allDay ? '全天' : event.timeLabel,
      description: event.description,
      location: event.location,
      meetingUrl: event.meetingUrl,
      href: event.href,
      sourceUrl: event.sourceUrl,
      status: event.status
    }))
].sort((left, right) => left.date.localeCompare(right.date))

const topicColor: Record<TopicKey, 'primary' | 'secondary' | 'success' | 'warning'> = {
  kernel: 'primary',
  comm: 'warning',
  serving: 'success',
  rl: 'secondary'
}

function asCalendarDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new CalendarDate(year, month, day)
}

function readableDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${year} 年 ${month} 月 ${day} 日`
}

export default function CalendarPage() {
  const firstDate = scheduleItems[0]?.date ?? '2026-01-01'
  const [selectedDate, setSelectedDate] = useState(firstDate)
  const selectedItems = scheduleItems.filter((item) => item.date === selectedDate)

  return (
    <div className="mx-auto w-[min(1140px,calc(100%-48px))] py-12 sm:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <span className="font-mono-label text-[11px] font-bold text-primary">COURSE CALENDAR</span>
          <h1 className="mt-3 text-4xl font-bold text-foreground sm:text-5xl">课程日历</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-500">
            共 {sessions.length} 场系列研讨、{scheduleItems.length} 项公开安排。数据由飞书同步
            Action 生成，选择日期即可查看当天活动和讲义入口。
          </p>
        </div>
        <Button size="sm" variant="flat" onPress={() => setSelectedDate(firstDate)}>
          回到首场活动
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card shadow="sm">
          <CardHeader className="pb-0">
            <p className="text-sm font-semibold">选择日期</p>
          </CardHeader>
          <CardBody className="pt-3">
            <Calendar<any>
              aria-label="课程日期"
              value={asCalendarDate(selectedDate)}
              onChange={(date) => setSelectedDate(String(date))}
              showMonthAndYearPickers
            />
          </CardBody>
        </Card>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">{readableDate(selectedDate)}</h2>
            <Chip size="sm" variant="flat">{selectedItems.length} 项安排</Chip>
          </div>

          {selectedItems.length === 0 ? (
            <Card shadow="none" className="border border-dashed border-divider">
              <CardBody className="py-10 text-center text-sm text-foreground-500">当天暂无安排</CardBody>
            </Card>
          ) : (
            <div className="grid gap-3">
              {selectedItems.map((item) => (
                <Card key={item.key} shadow="sm">
                  <CardHeader className="flex flex-wrap items-center gap-2 pb-1">
                    <Chip
                      size="sm"
                      color={item.topic ? topicColor[item.topic] : 'default'}
                      variant="flat"
                    >
                      {item.kind === 'session' ? '课程分享' : '日历活动'}
                    </Chip>
                    {item.timeLabel && <span className="text-xs text-foreground-500">{item.timeLabel}</span>}
                    {item.status === 'tentative' && <Chip size="sm" color="warning" variant="dot">待定</Chip>}
                    {item.status === 'cancelled' && <Chip size="sm" color="danger" variant="dot">已取消</Chip>}
                  </CardHeader>
                  <CardBody className="gap-2 pt-1">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    {item.owners?.length ? <p className="text-sm text-foreground-500">分享人：{item.owners.join('、')}</p> : null}
                    {item.description ? <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-600">{item.description}</p> : null}
                    {item.location ? <p className="text-sm text-foreground-500">地点：{item.location}</p> : null}
                    <div className="flex flex-wrap gap-4 pt-1 text-sm">
                      {item.href ? <Link href={docHref(item.href)}>查看讲义</Link> : null}
                      {item.meetingUrl ? <Link href={item.meetingUrl} isExternal>进入会议</Link> : null}
                      {item.sourceUrl ? <Link href={item.sourceUrl} isExternal color="foreground">飞书日历</Link> : null}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Divider className="my-12" />

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">全部安排</h2>
        <Table aria-label="全部课程与活动安排" removeWrapper>
          <TableHeader>
            <TableColumn>日期</TableColumn>
            <TableColumn>安排</TableColumn>
            <TableColumn>时间</TableColumn>
            <TableColumn>状态</TableColumn>
          </TableHeader>
          <TableBody emptyContent="暂无公开日程">
            {scheduleItems.map((item) => (
              <TableRow key={item.key}>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  {item.href ? <Link href={docHref(item.href)}>{item.title}</Link> : item.title}
                </TableCell>
                <TableCell>{item.timeLabel ?? '待定'}</TableCell>
                <TableCell>{item.status === 'cancelled' ? '已取消' : item.status === 'tentative' ? '待定' : '已确认'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

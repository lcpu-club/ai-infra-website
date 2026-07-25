'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Chip,
  Divider,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@heroui/react'
import type { CalendarEvent } from '@schedule-x/calendar'
import { viewDay, viewMonthGrid, viewWeek } from '@schedule-x/calendar'
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react'
import 'temporal-polyfill/global'
import { useTheme } from 'next-themes'
import {
  calendarEvents,
  calendarTimezone,
  type CalendarStatus
} from '@/docs/.vitepress/data/program'
import { docHref } from '@/lib/site'

type ScheduleItem = {
  key: string
  date: string
  title: string
  kind: 'event'
  allDay: boolean
  startAt: string
  endAt: string
  timeLabel?: string
  owners?: string[]
  description?: string
  location?: string
  meetingUrl?: string
  href?: string
  sourceUrl?: string
  status?: CalendarStatus
}

// 仅消费 GitHub Action 同步进 program.ts 的飞书日程快照。
const scheduleItems: ScheduleItem[] = [
  ...calendarEvents
    .map((event) => ({
      key: `event-${event.eventId}`,
      date: event.date,
      title: event.summary,
      kind: 'event' as const,
      allDay: event.allDay,
      startAt: event.startAt,
      endAt: event.endAt,
      timeLabel: event.allDay ? '全天' : event.timeLabel,
      description: event.description,
      location: event.location,
      meetingUrl: event.meetingUrl,
      href: event.href,
      sourceUrl: event.sourceUrl,
      status: event.status
    }))
].sort((left, right) => left.date.localeCompare(right.date))

function hourBoundary(hour: number) {
  return `${String(Math.min(24, Math.max(0, hour))).padStart(2, '0')}:00`
}

function getScheduleDayBoundaries(items: ScheduleItem[]) {
  const timedItems = items.filter((item) => !item.allDay)

  if (timedItems.length === 0) {
    return { start: '09:00', end: '20:00' }
  }

  const starts = timedItems.map((item) =>
    Temporal.Instant.from(item.startAt).toZonedDateTimeISO(calendarTimezone)
  )
  const ends = timedItems.map((item) =>
    Temporal.Instant.from(item.endAt).toZonedDateTimeISO(calendarTimezone)
  )
  const earliestHour = Math.min(...starts.map((dateTime) => dateTime.hour))
  const latestHour = Math.max(
    ...ends.map((dateTime) =>
      dateTime.hour + (dateTime.minute || dateTime.second ? 1 : 0)
    )
  )

  return {
    start: hourBoundary(earliestHour - 1),
    end: hourBoundary(Math.max(earliestHour + 2, latestHour + 1))
  }
}

const scheduleDayBoundaries = getScheduleDayBoundaries(scheduleItems)

function readableDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${year} 年 ${month} 月 ${day} 日`
}

export default function CalendarPage() {
  const firstDate = scheduleItems[0]?.date ?? '2026-01-01'
  const [selectedKey, setSelectedKey] = useState(scheduleItems[0]?.key ?? '')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const selectedItem = scheduleItems.find((item) => item.key === selectedKey) ?? scheduleItems[0]

  const calendarEvents = useMemo<CalendarEvent[]>(
    () => scheduleItems.map((item) => {
      const start = item.allDay
        ? Temporal.PlainDate.from(item.date)
        : Temporal.Instant.from(item.startAt).toZonedDateTimeISO(calendarTimezone)
      const end = item.allDay
        ? Temporal.PlainDate.from(item.date)
        : Temporal.Instant.from(item.endAt).toZonedDateTimeISO(calendarTimezone)

      return {
        id: item.key,
        title: item.title,
        start,
        end,
        description: item.description,
        location: item.location,
        people: item.owners,
        calendarId: 'event',
        _options: { disableDND: true, disableResize: true }
      }
    }),
    []
  )

  const calendarApp = useCalendarApp({
    views: [viewMonthGrid, viewWeek, viewDay],
    defaultView: 'month-grid',
    selectedDate: Temporal.PlainDate.from(firstDate),
    events: calendarEvents,
    locale: 'zh-CN',
    timezone: calendarTimezone,
    firstDayOfWeek: 1,
    // 由同步到的定时日程自动收窄日/周视图，全天事项不影响小时轴。
    dayBoundaries: scheduleDayBoundaries,
    // 以月历作为所有断点的初始视图，避免窄屏自动切到按小时视图。
    isResponsive: false,
    monthGridOptions: { nEventsPerDay: 3 },
    calendars: {
      event: {
        colorName: 'Calendar event',
        lightColors: { main: '#8f1d2c', container: '#f7eaec', onContainer: '#5d101b' },
        darkColors: { main: '#e26473', container: '#552730', onContainer: '#ffe8eb' }
      }
    },
    callbacks: {
      onEventClick: (event) => {
        setSelectedKey(String(event.id))
        setIsDetailOpen(true)
      }
    }
  })

  useEffect(() => {
    calendarApp?.setTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
  }, [calendarApp, resolvedTheme])

  return (
    <div className="mx-auto w-[min(1140px,calc(100%-48px))] py-12 sm:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <span className="font-mono-label text-[11px] font-bold text-primary">COURSE CALENDAR</span>
          <h1 className="mt-3 text-4xl font-bold text-foreground sm:text-5xl">课程日历</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-500">
            共 {scheduleItems.length} 项飞书公开安排。数据由飞书同步 Action 生成，点击日程
            可查看时间、地点与相关入口。
          </p>
        </div>
        <Button
          size="sm"
          variant="flat"
          onPress={() => {
            setSelectedKey(scheduleItems[0]?.key ?? '')
            setIsDetailOpen(Boolean(scheduleItems[0]))
          }}
        >
          回到首场活动
        </Button>
      </header>

      <section className="schedule-x-shell" aria-label="课程月历">
        <ScheduleXCalendar calendarApp={calendarApp} />
      </section>

      <Modal
        isOpen={isDetailOpen && Boolean(selectedItem)}
        onOpenChange={setIsDetailOpen}
        placement="center"
        scrollBehavior="inside"
        classNames={{ wrapper: 'z-[200]', backdrop: 'z-[200]' }}
      >
        <ModalContent>
          {(onClose) => selectedItem ? (
            <>
              <ModalHeader className="flex flex-col gap-2">
                <span className="text-sm font-normal text-foreground-500">{readableDate(selectedItem.date)}</span>
                <span>{selectedItem.title}</span>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-wrap gap-2">
                  <Chip size="sm" variant="flat">飞书日程</Chip>
                  {selectedItem.timeLabel && <Chip size="sm" variant="flat">{selectedItem.timeLabel}</Chip>}
                  {selectedItem.status === 'tentative' && <Chip size="sm" color="warning" variant="dot">待定</Chip>}
                  {selectedItem.status === 'cancelled' && <Chip size="sm" color="danger" variant="dot">已取消</Chip>}
                </div>
                {selectedItem.owners?.length ? <p className="text-sm text-foreground-500">参与人：{selectedItem.owners.join('、')}</p> : null}
                {selectedItem.description ? <p className="whitespace-pre-line text-sm leading-relaxed text-foreground-600">{selectedItem.description}</p> : null}
                {selectedItem.location ? <p className="text-sm text-foreground-500">地点：{selectedItem.location}</p> : null}
              </ModalBody>
              <ModalFooter className="flex flex-wrap justify-between gap-2">
                <Button variant="light" onPress={onClose}>关闭</Button>
                <div className="flex flex-wrap gap-3 text-sm">
                  {selectedItem.href ? <Link href={docHref(selectedItem.href)}>查看讲义</Link> : null}
                  {selectedItem.meetingUrl ? <Link href={selectedItem.meetingUrl} isExternal>进入会议</Link> : null}
                  {selectedItem.sourceUrl ? <Link href={selectedItem.sourceUrl} isExternal color="foreground">飞书日历</Link> : null}
                </div>
              </ModalFooter>
            </>
          ) : null}
        </ModalContent>
      </Modal>

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

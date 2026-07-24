<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import {
  calendarEvents,
  type CalendarEvent
} from '../../data/program'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    limit?: number
  }>(),
  {
    compact: false,
    limit: 0
  }
)

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})
const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'UTC',
  weekday: 'short'
})
const now = ref(Date.now())
const today = ref(dateFormatter.format(new Date()))

onMounted(() => {
  now.value = Date.now()
  today.value = dateFormatter.format(new Date())
})

const visibleEvents = computed(() => {
  if (props.limit <= 0) return calendarEvents
  const upcoming = calendarEvents.filter(
    (event) => event.status !== 'cancelled' && !hasEnded(event)
  )
  const candidates =
    upcoming.length > 0 ? upcoming : calendarEvents.slice(-props.limit)
  return candidates.slice(0, props.limit)
})

const nextEventId = computed(
  () =>
    calendarEvents.find(
      (event) =>
        event.status !== 'cancelled' &&
        !hasEnded(event)
    )?.eventId
)

function statusFor(event: CalendarEvent) {
  if (event.status === 'cancelled') return 'cancelled'
  if (hasEnded(event)) return 'past'
  if (isHappeningNow(event)) return 'today'
  if (event.eventId === nextEventId.value) return 'next'
  return 'upcoming'
}

function statusLabel(event: CalendarEvent) {
  return {
    past: '已结束',
    today: '今天',
    next: '下一项',
    cancelled: '已取消',
    upcoming: ''
  }[statusFor(event)]
}

function confirmationLabel(event: CalendarEvent) {
  if (event.status === 'tentative') return '待确认'
  if (event.status === 'confirmed') return '已确认'
  return ''
}

function inclusiveEndDate(event: CalendarEvent) {
  if (!event.allDay || event.endDate <= event.date) return event.date
  const end = new Date(`${event.endDate}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  return end.toISOString().slice(0, 10)
}

function hasEnded(event: CalendarEvent) {
  if (event.allDay) return inclusiveEndDate(event) < today.value
  const end = Date.parse(event.endAt)
  return Number.isFinite(end) ? end < now.value : event.date < today.value
}

function isHappeningNow(event: CalendarEvent) {
  if (event.allDay) {
    return event.date <= today.value && inclusiveEndDate(event) >= today.value
  }
  const start = Date.parse(event.startAt)
  const end = Date.parse(event.endAt)
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start <= now.value &&
    end >= now.value
  )
}

function displayDate(event: CalendarEvent) {
  const endDate = inclusiveEndDate(event)
  if (endDate === event.date) return event.dateLabel
  return `${event.dateLabel}–${endDate.slice(5).replace('-', '.')}`
}

function weekdayFor(date: string) {
  return weekdayFormatter.format(new Date(`${date}T12:00:00Z`))
}

function timezoneLabel(timezone: string) {
  return (
    {
      'Asia/Shanghai': '北京时间',
      'Asia/Singapore': '新加坡时间'
    }[timezone] || timezone
  )
}
</script>

<template>
  <div
    v-if="visibleEvents.length"
    class="calendar-event-list"
    :class="{ 'is-compact': compact }"
  >
    <article
      v-for="event in visibleEvents"
      :id="`event-${event.eventId}`"
      :key="event.eventId"
      class="calendar-event"
      :class="`is-${statusFor(event)}`"
    >
      <div class="calendar-event-date">
        <time :datetime="event.startAt">
          <strong>{{ displayDate(event) }}</strong>
          <span>{{ weekdayFor(event.date) }}</span>
        </time>
      </div>

      <div class="calendar-event-body">
        <div class="calendar-event-meta">
          <span>{{ event.timeLabel }}</span>
          <span v-if="!event.allDay">{{ timezoneLabel(event.timezone) }}</span>
          <span
            v-if="statusLabel(event)"
            class="calendar-event-state"
          >
            {{ statusLabel(event) }}
          </span>
          <span
            v-if="confirmationLabel(event)"
            class="calendar-event-confirmation"
          >
            {{ confirmationLabel(event) }}
          </span>
        </div>

        <h3>
          <a v-if="event.href" :href="withBase(event.href)">
            {{ event.summary }}
          </a>
          <template v-else>{{ event.summary }}</template>
        </h3>

        <p v-if="event.description" class="calendar-event-description">
          {{ event.description }}
        </p>
        <p
          v-else-if="!compact"
          class="calendar-event-description is-empty"
        >
          日程说明待补充
        </p>

        <dl v-if="event.location" class="calendar-event-details">
          <div>
            <dt>地点</dt>
            <dd>{{ event.location }}</dd>
          </div>
        </dl>

        <nav
          v-if="event.href || event.sourceUrl || event.meetingUrl"
          class="calendar-event-actions"
          aria-label="日程相关链接"
        >
          <a v-if="event.href" :href="withBase(event.href)">查看讲义 →</a>
          <a
            v-if="event.sourceUrl"
            :href="event.sourceUrl"
            target="_blank"
            rel="noreferrer"
          >
            飞书日历 ↗
          </a>
          <a
            v-if="event.meetingUrl"
            :href="event.meetingUrl"
            target="_blank"
            rel="noreferrer"
          >
            加入会议 ↗
          </a>
        </nav>
      </div>
    </article>
  </div>

  <div v-else class="calendar-empty-state">
    <span>CALENDAR</span>
    <h3>共享日历中暂时没有活动</h3>
    <p>在 AI Infra 共享日历中新建日程后，网站会在下一次同步时自动更新。</p>
  </div>
</template>

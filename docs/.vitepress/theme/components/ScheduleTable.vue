<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { Temporal } from 'temporal-polyfill'
import {
  calendarEvents,
  type CalendarEvent
} from '../../data/program'
import EventLocation from './EventLocation.vue'

const now = ref(Date.now())
let clock: number | undefined

onMounted(() => {
  now.value = Date.now()
  clock = window.setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (clock !== undefined) window.clearInterval(clock)
})

function inclusiveEndDate(event: CalendarEvent) {
  if (!event.allDay || event.endDate <= event.date) return event.date
  const end = new Date(`${event.endDate}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  return end.toISOString().slice(0, 10)
}

function dateLabel(event: CalendarEvent) {
  const endDate = inclusiveEndDate(event)
  if (endDate === event.date) return event.date
  return `${event.date} 至 ${endDate}`
}

function eventBoundary(event: CalendarEvent, boundary: 'start' | 'end') {
  if (event.allDay) {
    const date = boundary === 'start' ? event.date : event.endDate
    return Temporal.PlainDate.from(date).toZonedDateTime(event.timezone)
      .epochMilliseconds
  }
  return Temporal.Instant.from(
    boundary === 'start' ? event.startAt : event.endAt
  ).epochMilliseconds
}

function phaseFor(event: CalendarEvent) {
  if (now.value < eventBoundary(event, 'start')) return 'upcoming'
  if (now.value >= eventBoundary(event, 'end')) return 'ended'
  return 'ongoing'
}

function phaseLabel(event: CalendarEvent) {
  return {
    upcoming: '待开始',
    ongoing: '进行中',
    ended: '已结束'
  }[phaseFor(event)]
}
</script>

<template>
  <div v-if="calendarEvents.length" class="schedule-table-wrap">
    <table class="schedule-table">
      <thead>
        <tr>
          <th scope="col">日期</th>
          <th scope="col">安排</th>
          <th scope="col">活动内容</th>
          <th scope="col">讲者</th>
          <th scope="col">作业</th>
          <th scope="col">时间</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="event in calendarEvents"
          :id="`event-${event.eventId}`"
          :key="event.eventId"
        >
          <td>
            <div class="schedule-date">
              <span
                class="schedule-phase"
                :class="`is-${phaseFor(event)}`"
              >
                {{ phaseLabel(event) }}
              </span>
              <time :datetime="event.startAt">{{ dateLabel(event) }}</time>
            </div>
          </td>
          <td>
            <a v-if="event.href" :href="withBase(event.href)">
              {{ event.summary }}
            </a>
            <span v-else>{{ event.summary }}</span>
            <small v-if="event.location">
              <EventLocation :location="event.location" />
            </small>
          </td>
          <td class="schedule-content">
            <span v-if="event.description">{{ event.description }}</span>
            <span v-else class="is-empty">暂无活动说明</span>
          </td>
          <td class="schedule-speakers">
            <span v-if="event.speakers?.length">
              {{ event.speakers.join('、') }}
            </span>
            <span v-else class="is-empty">待定</span>
          </td>
          <td>
            <a
              v-if="event.assignment?.href"
              :href="withBase(event.assignment.href)"
            >
              {{ event.assignment.title }}
            </a>
            <span v-else-if="event.assignment">
              {{ event.assignment.title }}
            </span>
          </td>
          <td>{{ event.timeLabel }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="calendar-empty-state">
    <h3>共享日历中暂时没有活动</h3>
    <p>在 AI Infra 共享日历中新建日程后，网站会在下一次同步时自动更新。</p>
  </div>
</template>

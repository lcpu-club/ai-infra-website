<script setup lang="ts">
import { withBase } from 'vitepress'
import {
  calendarEvents,
  type CalendarEvent
} from '../../data/program'

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

function statusLabel(event: CalendarEvent) {
  if (event.status === 'cancelled') return '已取消'
  if (event.status === 'confirmed') return '已确认'
  return '待确认'
}
</script>

<template>
  <div v-if="calendarEvents.length" class="schedule-table-wrap">
    <table class="schedule-table">
      <thead>
        <tr>
          <th scope="col">日期</th>
          <th scope="col">安排</th>
          <th scope="col">时间</th>
          <th scope="col">状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in calendarEvents" :id="`event-${event.eventId}`" :key="event.eventId">
          <td>
            <time :datetime="event.startAt">{{ dateLabel(event) }}</time>
          </td>
          <td>
            <a v-if="event.href" :href="withBase(event.href)">
              {{ event.summary }}
            </a>
            <span v-else>{{ event.summary }}</span>
            <small v-if="event.location">{{ event.location }}</small>
          </td>
          <td>{{ event.timeLabel }}</td>
          <td>
            <span
              class="schedule-status"
              :class="`is-${event.status}`"
            >
              {{ statusLabel(event) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="calendar-empty-state">
    <h3>共享日历中暂时没有活动</h3>
    <p>在 AI Infra 共享日历中新建日程后，网站会在下一次同步时自动更新。</p>
  </div>
</template>

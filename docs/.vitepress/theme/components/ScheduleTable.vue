<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Temporal } from 'temporal-polyfill'
import {
  calendarEvents,
  type CalendarEvent
} from '../../data/program'
import {
  localizeCalendarEvent,
  useSiteLocale
} from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

const { locale, copy, href } = useSiteLocale()
const displayedEvents = computed(() =>
  calendarEvents.map((event) => localizeCalendarEvent(event, locale.value))
)
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
  return `${event.date} ${copy.value.schedule.dateRangeSeparator} ${endDate}`
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
  return copy.value.schedule.phases[phaseFor(event)]
}
</script>

<template>
  <div v-if="calendarEvents.length" class="schedule-table-wrap">
    <table class="schedule-table">
      <thead>
        <tr>
          <th v-for="header in copy.schedule.headers" :key="header" scope="col">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="event in displayedEvents"
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
            <a v-if="event.href" :href="href(event.href)">
              {{ event.summary }}
            </a>
            <span v-else>{{ event.summary }}</span>
            <small v-if="event.location">
              <EventLocation :location="event.location" />
            </small>
          </td>
          <td class="schedule-content">
            <span v-if="event.description">{{ event.description }}</span>
            <span v-else class="is-empty">{{ copy.schedule.noDescription }}</span>
          </td>
          <td class="schedule-speakers">
            <span v-if="event.speakers?.length">
              {{ event.speakers.join(locale === 'en' ? ', ' : '、') }}
            </span>
            <span v-else class="is-empty">{{ copy.schedule.speakerTbd }}</span>
          </td>
          <td>
            <a
              v-if="event.assignment?.href"
              :href="href(event.assignment.href)"
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
    <h3>{{ copy.schedule.emptyTitle }}</h3>
    <p>{{ copy.schedule.emptyDescription }}</p>
  </div>
</template>

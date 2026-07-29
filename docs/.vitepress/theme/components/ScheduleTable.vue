<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Temporal } from 'temporal-polyfill'
import {
  localizedCalendarEvents,
  type CalendarEvent
} from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

const { locale, copy, href } = useSiteLocale()
const displayedEvents = computed(() =>
  localizedCalendarEvents(locale.value)
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
  if (event.status === 'cancelled') return 'cancelled'
  if (now.value < eventBoundary(event, 'start')) return 'upcoming'
  if (now.value >= eventBoundary(event, 'end')) return 'ended'
  return 'ongoing'
}

function phaseLabel(event: CalendarEvent) {
  if (event.status === 'cancelled') return copy.value.schedule.statuses.cancelled
  return copy.value.schedule.phases[phaseFor(event)]
}

function descriptionPreview(description: string) {
  const normalized = description.replace(/\s+/g, ' ').trim()
  return normalized.length > 120
    ? `${normalized.slice(0, 120).trimEnd()}…`
    : normalized
}

function isLongDescription(description: string) {
  return description.replace(/\s+/g, ' ').trim().length > 120
}

function linkHref(link: string) {
  return href(link)
}

function isExternal(link: string) {
  return /^https?:\/\//.test(link)
}

</script>

<template>
  <div v-if="displayedEvents.length" class="schedule-table-wrap">
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
          <td :data-label="copy.schedule.headers[0]">
            <div class="schedule-date">
              <span
                class="schedule-phase"
                :class="`is-${phaseFor(event)}`"
              >
                {{ phaseLabel(event) }}
              </span>
              <time :datetime="event.startAt">{{ dateLabel(event) }}</time>
              <span class="schedule-time">{{ event.timeLabel }}</span>
            </div>
          </td>
          <td :data-label="copy.schedule.headers[1]">
            <span>{{ event.summary }}</span>
            <small v-if="event.locations.length">
              <EventLocation :locations="event.locations" />
            </small>
          </td>
          <td
            class="schedule-content"
            :data-label="copy.schedule.headers[2]"
          >
            <details
              v-if="event.description && isLongDescription(event.description)"
              class="schedule-description"
            >
              <summary>
                <span class="schedule-description-preview">
                  {{ descriptionPreview(event.description) }}
                </span>
                <span
                  class="schedule-description-action schedule-description-expand"
                >
                  {{ copy.schedule.expandContent }}
                </span>
                <span
                  class="schedule-description-action schedule-description-collapse"
                >
                  {{ copy.schedule.collapseContent }}
                </span>
              </summary>
              <p>{{ event.description }}</p>
            </details>
            <span v-else-if="event.description">{{ event.description }}</span>
            <span v-else class="is-empty">{{ copy.schedule.noDescription }}</span>
          </td>
          <td
            class="schedule-speakers"
            :data-label="copy.schedule.headers[3]"
          >
            <template v-if="event.speakers?.length">
              <span
                v-for="speaker in event.speakers"
                :key="speaker"
                class="schedule-speaker"
              >
                {{ speaker }}
              </span>
            </template>
            <span v-else class="is-empty">{{ copy.schedule.speakerTbd }}</span>
          </td>
          <td
            class="schedule-resources"
            :data-label="copy.schedule.headers[4]"
          >
            <div
              v-if="event.links.length"
              class="schedule-resource-links"
            >
              <a
                v-for="link in event.links"
                :key="`${event.eventId}-${link.href}`"
                :href="linkHref(link.href)"
                :target="isExternal(link.href) ? '_blank' : undefined"
                :rel="isExternal(link.href) ? 'noreferrer' : undefined"
              >
                {{ link.label }}
              </a>
            </div>
            <div
              v-if="event.assignments.length"
              class="schedule-assignment-links"
            >
              <a
                v-for="assignment in event.assignments"
                :key="assignment.id"
                :href="href(assignment.href)"
                :title="assignment.title"
              >
                {{ assignment.id }}
              </a>
            </div>
            <span
              v-if="
                !event.links.length &&
                  !event.assignments.length
              "
              class="is-empty"
            >—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="calendar-empty-state">
    <h3>{{ copy.schedule.emptyTitle }}</h3>
    <p>{{ copy.schedule.emptyDescription }}</p>
  </div>
</template>

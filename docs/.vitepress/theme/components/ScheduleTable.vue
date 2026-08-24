<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Temporal } from 'temporal-polyfill'
import { MapPin, UserRound } from 'lucide-vue-next'
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

function dateRangeLabel(event: CalendarEvent) {
  const endDate = inclusiveEndDate(event)
  if (endDate === event.date) return ''
  return `${event.date} ${copy.value.schedule.dateRangeSeparator} ${endDate}`
}

function dateParts(event: CalendarEvent) {
  const date = new Date(`${event.date}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat(
    locale.value === 'en' ? 'en-US' : 'zh-CN',
    { timeZone: 'UTC', month: 'short', weekday: 'short' }
  ).formatToParts(date)
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  return {
    day: String(date.getUTCDate()).padStart(2, '0'),
    caption: `${month} · ${weekday}`
  }
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

function typeClass(event: CalendarEvent) {
  if (event.type === 'guest-lecture') return 'is-guest-lecture'
  if (event.type === 'workshop') return 'is-workshop'
  return 'is-lecture'
}

function typeLabel(event: CalendarEvent) {
  const types = copy.value.schedule.eventTypes
  if (event.type === 'guest-lecture') return types.guestLecture
  if (event.type === 'workshop') return types.workshop
  return types.lecture
}

function speakersLabel(event: CalendarEvent) {
  return (event.speakers ?? []).join(locale.value === 'en' ? ', ' : '、')
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

function openDetails(event: CalendarEvent) {
  window.dispatchEvent(
    new CustomEvent('calendar:open-event', { detail: event.eventId })
  )
}
</script>

<template>
  <div v-if="displayedEvents.length" class="schedule-event-list">
    <article
      v-for="event in displayedEvents"
      :id="`event-${event.eventId}`"
      :key="event.eventId"
      class="schedule-event"
      :class="`is-phase-${phaseFor(event)}`"
    >
      <div class="schedule-event-date">
        <strong>{{ dateParts(event).day }}</strong>
        <span>{{ dateParts(event).caption }}</span>
        <span class="schedule-event-time">{{ event.timeLabel }}</span>
        <span v-if="dateRangeLabel(event)" class="schedule-event-range">
          {{ dateRangeLabel(event) }}
        </span>
      </div>

      <div class="schedule-event-main">
        <div class="schedule-event-tags">
          <span class="schedule-event-type" :class="typeClass(event)">
            {{ typeLabel(event) }}
          </span>
          <span class="schedule-phase" :class="`is-${phaseFor(event)}`">
            {{ phaseLabel(event) }}
          </span>
          <button
            class="schedule-event-details"
            type="button"
            @click="openDetails(event)"
          >
            {{ copy.schedule.details }} →
          </button>
        </div>

        <h3 class="schedule-event-title">
          <button type="button" @click="openDetails(event)">
            {{ event.summary }}
          </button>
        </h3>

        <div
          v-if="event.locations.length || event.speakers?.length"
          class="schedule-event-meta"
        >
          <span v-if="event.locations.length" class="schedule-event-meta-item">
            <MapPin :size="14" aria-hidden="true" />
            <EventLocation :locations="event.locations" />
          </span>
          <span v-if="event.speakers?.length" class="schedule-event-meta-item">
            <UserRound :size="14" aria-hidden="true" />
            {{ speakersLabel(event) }}
          </span>
        </div>

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
        <p v-else-if="event.description" class="schedule-event-description">
          {{ event.description }}
        </p>

        <div
          v-if="event.links.length || event.assignments.length"
          class="schedule-event-links"
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
          <a
            v-for="assignment in event.assignments"
            :key="assignment.id"
            class="schedule-event-assignment"
            :href="href(assignment.href)"
            :title="assignment.title"
          >
            {{ assignment.id }}
          </a>
        </div>
      </div>
    </article>
  </div>

  <div v-else class="calendar-empty-state">
    <h3>{{ copy.schedule.emptyTitle }}</h3>
    <p>{{ copy.schedule.emptyDescription }}</p>
  </div>
</template>

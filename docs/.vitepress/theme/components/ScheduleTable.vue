<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Temporal } from 'temporal-polyfill'
import { CalendarDays, ChevronDown, MapPin, UserRound } from 'lucide-vue-next'
import {
  isReplayLinkLabel,
  localizedCalendarEvents,
  visibleLocations,
  type CalendarEvent,
  type ScheduleResourceLink
} from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

const { locale, copy, href } = useSiteLocale()
const displayedEvents = computed(() =>
  localizedCalendarEvents(locale.value)
)
const now = ref(Date.now())
const expanded = ref(new Set<string>())
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

function toggleExpanded(eventId: string, e: MouseEvent) {
  const next = new Set(expanded.value)
  const expanding = !next.has(eventId)
  if (expanding) {
    next.add(eventId)
  } else {
    next.delete(eventId)
  }
  expanded.value = next

  // Pin the current height inline, then release it to the target height
  // so the max-height transition has concrete start and end values.
  const button = e.currentTarget as HTMLElement | null
  const text = button
    ?.closest('.schedule-event')
    ?.querySelector<HTMLElement>('.schedule-event-desc-text')
  if (!text) return
  text.style.maxHeight = `${text.offsetHeight}px`
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      text.style.maxHeight = expanding ? `${text.scrollHeight}px` : ''
    })
  })
  if (expanding) {
    text.addEventListener(
      'transitionend',
      () => {
        text.style.maxHeight = ''
      },
      { once: true }
    )
  }
}

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

function readableDate(date: string) {
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(`${date}T12:00:00Z`))
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

function isLongDescription(description: string) {
  return description.replace(/\s+/g, ' ').trim().length > 120
}

function materialLinks(event: CalendarEvent): ScheduleResourceLink[] {
  return event.links.filter((link) => !isReplayLinkLabel(link.label))
}

function replayLinks(event: CalendarEvent): ScheduleResourceLink[] {
  return event.links.filter((link) => isReplayLinkLabel(link.label))
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
      v-for="(event, index) in displayedEvents"
      :id="`event-${event.eventId}`"
      :key="event.eventId"
      v-reveal="Math.min(index, 8) * 50"
      class="schedule-event"
      :class="`is-phase-${phaseFor(event)}`"
    >
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

      <div class="schedule-event-meta">
        <span class="schedule-event-meta-item">
          <CalendarDays :size="13" aria-hidden="true" />
          {{ readableDate(event.date) }}
          <template v-if="dateRangeLabel(event)">
            （{{ dateRangeLabel(event) }}）
          </template>
          <template v-if="event.timeLabel"> · {{ event.timeLabel }}</template>
        </span>
        <span
          v-if="visibleLocations(event, now).length"
          class="schedule-event-meta-item"
        >
          <MapPin :size="13" aria-hidden="true" />
          <EventLocation :locations="visibleLocations(event, now)" />
        </span>
        <span v-if="event.speakers?.length" class="schedule-event-meta-item">
          <UserRound :size="13" aria-hidden="true" />
          {{ speakersLabel(event) }}
        </span>
      </div>

      <template v-if="event.description">
        <div
          class="schedule-event-desc"
          :class="{
            'is-clamped':
              isLongDescription(event.description) &&
                !expanded.has(event.eventId)
          }"
        >
          <p class="schedule-event-desc-text">{{ event.description }}</p>
        </div>
        <button
          v-if="isLongDescription(event.description)"
          class="schedule-event-desc-toggle"
          type="button"
          :aria-expanded="expanded.has(event.eventId)"
          @click="toggleExpanded(event.eventId, $event)"
        >
          {{
            expanded.has(event.eventId)
              ? copy.schedule.collapseContent
              : copy.schedule.expandContent
          }}
          <ChevronDown
            :size="13"
            aria-hidden="true"
            :class="{ 'is-flipped': expanded.has(event.eventId) }"
          />
        </button>
      </template>

      <div
        v-if="event.links.length || event.assignments.length"
        class="schedule-event-links"
      >
        <div
          v-if="materialLinks(event).length"
          class="schedule-event-link-row"
        >
          <span class="schedule-event-link-label">
            {{ copy.schedule.linkGroups.materials }}
          </span>
          <a
            v-for="link in materialLinks(event)"
            :key="`${event.eventId}-${link.href}`"
            :href="linkHref(link.href)"
            :target="isExternal(link.href) ? '_blank' : undefined"
            :rel="isExternal(link.href) ? 'noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
        </div>
        <div
          v-if="replayLinks(event).length"
          class="schedule-event-link-row"
        >
          <span class="schedule-event-link-label">
            {{ copy.schedule.linkGroups.replays }}
          </span>
          <a
            v-for="link in replayLinks(event)"
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
          class="schedule-event-link-row"
        >
          <span class="schedule-event-link-label">
            {{ copy.schedule.linkGroups.assignments }}
          </span>
          <a
            v-for="assignment in event.assignments"
            :key="assignment.id"
            class="schedule-event-assignment"
            :href="href(assignment.href)"
          >
            {{ assignment.id }}: {{ assignment.title }}
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

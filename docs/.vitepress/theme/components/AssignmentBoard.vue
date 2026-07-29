<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import {
  calendarTimezone,
  localizedAssignments,
  localizedCalendarEvents,
  type AssignmentMoment,
  type CourseAssignment
} from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'

const { locale, copy, href } = useSiteLocale()
const assignments = computed(() => localizedAssignments(locale.value))
const eventById = computed(
  () =>
    new Map(
      localizedCalendarEvents(locale.value).map((event) => [
        event.eventId,
        event
      ])
    )
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

function phaseFor(assignment: CourseAssignment) {
  if (
    assignment.release &&
    now.value < Date.parse(assignment.release.boundaryAt)
  ) {
    return 'upcoming'
  }
  if (assignment.due && now.value >= Date.parse(assignment.due.boundaryAt)) {
    return 'ended'
  }
  if (!assignment.due) return 'noDeadline'
  return 'open'
}

function formatMoment(
  moment: AssignmentMoment | undefined,
  fallback: string
) {
  if (!moment) return fallback
  if (moment.allDay) {
    return new Intl.DateTimeFormat(
      locale.value === 'en' ? 'en-US' : 'zh-CN',
      {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).format(new Date(`${moment.date}T12:00:00Z`))
  }
  return new Intl.DateTimeFormat(
    locale.value === 'en' ? 'en-US' : 'zh-CN',
    {
      timeZone: calendarTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  ).format(new Date(moment.at ?? moment.boundaryAt))
}

function relatedEvents(assignment: CourseAssignment) {
  return assignment.eventIds
    .map((id) => eventById.value.get(id))
    .filter((event) => event !== undefined)
}

function isExternal(value: string) {
  return /^https?:\/\//.test(value)
}
</script>

<template>
  <main class="course-site assignment-page-shell">
    <header class="assignment-page-header">
      <h1>{{ copy.assignments.title }}</h1>
      <a :href="withBase('/assignments.ics')" download>
        {{ copy.assignments.downloadDeadlines }}
      </a>
    </header>

    <div v-if="assignments.length" class="assignment-table-wrap">
      <table class="assignment-table">
        <thead>
          <tr>
            <th
              v-for="header in copy.assignments.headers"
              :key="header"
              scope="col"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="assignment in assignments"
            :id="`assignment-${assignment.id}`"
            :key="assignment.id"
          >
            <td :data-label="copy.assignments.headers[0]">
              <strong class="assignment-id">{{ assignment.id }}</strong>
            </td>
            <td :data-label="copy.assignments.headers[1]">
              <a
                v-if="assignment.href"
                :href="href(assignment.href)"
                :target="isExternal(assignment.href) ? '_blank' : undefined"
                :rel="isExternal(assignment.href) ? 'noreferrer' : undefined"
              >
                {{ assignment.title }}
              </a>
              <strong v-else>{{ assignment.title }}</strong>
              <div v-if="assignment.links.length" class="assignment-links">
                <a
                  v-for="link in assignment.links"
                  :key="`${assignment.id}-${link.type}-${link.href}`"
                  :href="href(link.href)"
                  :target="isExternal(link.href) ? '_blank' : undefined"
                  :rel="isExternal(link.href) ? 'noreferrer' : undefined"
                >
                  {{ link.label }}
                </a>
              </div>
            </td>
            <td :data-label="copy.assignments.headers[2]">
              <div
                v-if="relatedEvents(assignment).length"
                class="assignment-events"
              >
                <a
                  v-for="event in relatedEvents(assignment)"
                  :key="event.eventId"
                  :href="href(`/schedule#event-${event.eventId}`)"
                >
                  {{ event.summary }}
                </a>
              </div>
              <span v-else class="is-empty">
                {{ copy.assignments.noEvents }}
              </span>
            </td>
            <td :data-label="copy.assignments.headers[3]">
              {{ formatMoment(assignment.release, copy.assignments.noRelease) }}
            </td>
            <td :data-label="copy.assignments.headers[4]">
              {{ formatMoment(assignment.due, copy.assignments.noDue) }}
            </td>
            <td :data-label="copy.assignments.headers[5]">
              <span
                class="assignment-phase"
                :class="`is-${phaseFor(assignment)}`"
              >
                {{ copy.assignments.phases[phaseFor(assignment)] }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="assignment-empty-state">
      <h2>{{ copy.assignments.emptyTitle }}</h2>
      <p>{{ copy.assignments.emptyDescription }}</p>
    </div>
  </main>
</template>

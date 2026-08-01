<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { ScheduleXCalendar } from '@schedule-x/vue'
import {
  createCalendar,
  viewDay,
  viewMonthAgenda,
  viewMonthGrid,
  viewWeek,
  type CalendarEvent as ScheduleXEvent
} from '@schedule-x/calendar'
import 'temporal-polyfill/global'
import {
  calendarTimezone,
  localizedAssignments,
  localizedCalendarEvents,
  type CalendarEvent
} from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

const { isDark } = useData()
const { locale, copy, href } = useSiteLocale()
const displayedEvents = localizedCalendarEvents(locale.value).filter(
  (event) => event.display.calendar
)
const displayedAssignments = localizedAssignments(locale.value).filter(
  (assignment) => assignment.due
)
const selectedEvent = ref<CalendarEvent | null>(null)
const eventById = new Map(
  displayedEvents.map((event) => [event.eventId, event])
)
const assignmentById = new Map(
  displayedAssignments.map((assignment) => [assignment.id, assignment])
)

function hourBoundary(hour: number) {
  return `${String(Math.min(24, Math.max(0, hour))).padStart(2, '0')}:00`
}

function visibleDayBoundaries() {
  const timedEvents = displayedEvents.filter((event) => !event.allDay)
  const starts = timedEvents.map((event) =>
    Temporal.Instant.from(event.startAt).toZonedDateTimeISO(calendarTimezone)
  )
  if (starts.length === 0) return { start: '09:00', end: '20:00' }
  const ends = timedEvents.map((event) =>
    Temporal.Instant.from(event.endAt).toZonedDateTimeISO(calendarTimezone)
  )
  const earliestHour = Math.min(...starts.map((dateTime) => dateTime.hour))
  const latestHour = Math.max(
    ...ends.map(
      (dateTime) =>
        dateTime.hour + (dateTime.minute || dateTime.second ? 1 : 0)
    )
  )

  return {
    start: hourBoundary(earliestHour - 1),
    end: hourBoundary(Math.max(earliestHour + 2, latestHour + 1))
  }
}

function allDayEnd(event: CalendarEvent) {
  const start = Temporal.PlainDate.from(event.date)
  if (event.endDate <= event.date) return start
  return Temporal.PlainDate.from(event.endDate).subtract({ days: 1 })
}

const lectureEvents: ScheduleXEvent[] = displayedEvents.map((event) => ({
  id: event.eventId,
  title: event.summary,
  start: event.allDay
    ? Temporal.PlainDate.from(event.date)
    : Temporal.Instant.from(event.startAt).toZonedDateTimeISO(calendarTimezone),
  end: event.allDay
    ? allDayEnd(event)
    : Temporal.Instant.from(event.endAt).toZonedDateTimeISO(calendarTimezone),
  description: event.description,
  ...(event.locations.length
    ? { location: event.locations.map(({ label }) => label).join(' · ') }
    : {}),
  calendarId:
    event.type === 'guest-lecture'
      ? 'guest-lecture'
      : event.type === 'workshop'
        ? 'workshop'
        : 'lecture',
  _options: {
    disableDND: true,
    disableResize: true,
    additionalClasses:
      event.status === 'cancelled' ? ['is-cancelled'] : undefined
  }
}))

const assignmentEvents: ScheduleXEvent[] = displayedAssignments.map(
  (assignment) => {
    const due = assignment.due!
    const deadlineTime = due.allDay
      ? ''
      : Temporal.Instant.from(due.at!)
          .toZonedDateTimeISO(calendarTimezone)
          .toPlainTime()
          .toString({ smallestUnit: 'minute' })
    const deadlineDate = Temporal.PlainDate.from(due.date)
    return {
      id: `assignment-${assignment.id}`,
      title: `${deadlineTime ? `${deadlineTime} ` : ''}[DDL] ${assignment.id} · ${assignment.title}`,
      start: deadlineDate,
      end: deadlineDate,
      description: assignment.description,
      calendarId: 'assignment',
      _options: {
        disableDND: true,
        disableResize: true,
        additionalClasses: ['is-assignment-deadline']
      }
    }
  }
)

const timelineEvents: ScheduleXEvent[] = [
  ...lectureEvents,
  ...assignmentEvents
]

const calendarApp = createCalendar({
  views: [viewMonthGrid, viewMonthAgenda, viewWeek, viewDay],
  defaultView: viewMonthGrid.name,
  selectedDate: Temporal.PlainDate.from(
    displayedEvents[0]?.date ?? new Date().toISOString().slice(0, 10)
  ),
  events: timelineEvents,
  locale: locale.value === 'en' ? 'en-US' : 'zh-CN',
  timezone: calendarTimezone,
  firstDayOfWeek: 1,
  dayBoundaries: visibleDayBoundaries(),
  isResponsive: true,
  monthGridOptions: { nEventsPerDay: 3 },
  calendars: {
    lecture: {
      colorName: 'lecture',
      lightColors: {
        main: '#3451b2',
        container: '#5672cd',
        onContainer: '#ffffff'
      },
      darkColors: {
        main: '#a8b1ff',
        container: '#3e63dd',
        onContainer: '#ffffff'
      }
    },
    'guest-lecture': {
      colorName: 'guest-lecture',
      lightColors: {
        main: '#7650a8',
        container: '#8b67b8',
        onContainer: '#ffffff'
      },
      darkColors: {
        main: '#d2b4f4',
        container: '#6d489c',
        onContainer: '#ffffff'
      }
    },
    workshop: {
      colorName: 'workshop',
      lightColors: {
        main: '#0f766e',
        container: '#0d9488',
        onContainer: '#ffffff'
      },
      darkColors: {
        main: '#99f6e4',
        container: '#0f766e',
        onContainer: '#ffffff'
      }
    },
    assignment: {
      colorName: 'assignment',
      lightColors: {
        main: '#a34f12',
        container: '#bd6425',
        onContainer: '#ffffff'
      },
      darkColors: {
        main: '#ffc38a',
        container: '#8f4310',
        onContainer: '#ffffff'
      }
    }
  },
  callbacks: {
    onEventClick(event) {
      const id = String(event.id)
      const assignmentId = id.startsWith('assignment-')
        ? id.slice('assignment-'.length)
        : ''
      if (assignmentId && assignmentById.has(assignmentId)) {
        window.location.href = href(
          `/assignments#assignment-${assignmentId}`
        )
        return
      }
      selectedEvent.value = eventById.get(id) ?? null
    }
  }
})

watch(
  isDark,
  (dark) => {
    calendarApp.setTheme(dark ? 'dark' : 'light')
  },
  { immediate: true }
)

watch(selectedEvent, (event) => {
  document.body.classList.toggle('has-calendar-dialog', Boolean(event))
})

function closeDialog() {
  selectedEvent.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDialog()
}

function openFirstEvent() {
  selectedEvent.value = displayedEvents[0] ?? null
}

function openEvent(event: Event) {
  const eventId = (event as CustomEvent<string>).detail
  selectedEvent.value = eventById.get(eventId) ?? null
}

function linkHref(value: string) {
  return href(value)
}

function isExternal(value: string) {
  return /^https?:\/\//.test(value)
}

function readableDate(date: string) {
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(`${date}T12:00:00Z`))
}

function statusLabel(status: CalendarEvent['status']) {
  return copy.value.schedule.statuses[status]
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('calendar:open-first', openFirstEvent)
  window.addEventListener('calendar:open-event', openEvent)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('calendar:open-first', openFirstEvent)
  window.removeEventListener('calendar:open-event', openEvent)
  document.body.classList.remove('has-calendar-dialog')
})
</script>

<template>
  <div class="sx-vue-calendar-wrapper">
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>

  <Teleport to="body">
    <div
      v-if="selectedEvent"
      class="calendar-dialog-backdrop"
      role="presentation"
      @click.self="closeDialog"
    >
      <section
        class="calendar-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-dialog-title"
      >
        <button
          class="calendar-dialog-close"
          type="button"
          :aria-label="copy.schedule.dialogClose"
          @click="closeDialog"
        >
          ×
        </button>

        <div class="calendar-dialog-labels">
          <span>{{ readableDate(selectedEvent.date) }}</span>
          <span>{{ selectedEvent.timeLabel }}</span>
          <span>{{ statusLabel(selectedEvent.status) }}</span>
        </div>

        <h2 id="calendar-dialog-title">{{ selectedEvent.summary }}</h2>

        <p v-if="selectedEvent.description" class="calendar-dialog-description">
          {{ selectedEvent.description }}
        </p>

        <dl
          v-if="selectedEvent.locations.length"
          class="calendar-dialog-details"
        >
          <div>
            <dt>{{ copy.schedule.location }}</dt>
            <dd>
              <EventLocation :locations="selectedEvent.locations" />
            </dd>
          </div>
        </dl>

        <footer class="calendar-dialog-actions">
          <a
            v-for="link in selectedEvent.links"
            :key="link.href"
            :href="linkHref(link.href)"
            :target="isExternal(link.href) ? '_blank' : undefined"
            :rel="isExternal(link.href) ? 'noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
          <a
            v-if="selectedEvent.assignments.length"
            :href="href('/assignments')"
          >
            {{ copy.schedule.assignments }}
          </a>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

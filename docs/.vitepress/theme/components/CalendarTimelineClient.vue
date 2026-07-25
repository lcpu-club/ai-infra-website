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
  calendarEvents,
  calendarTimezone,
  type CalendarEvent
} from '../../data/program'
import {
  localizeCalendarEvent,
  useSiteLocale
} from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

const { isDark } = useData()
const { locale, copy, href } = useSiteLocale()
const displayedEvents = calendarEvents.map((event) =>
  localizeCalendarEvent(event, locale.value)
)
const selectedEvent = ref<CalendarEvent | null>(null)
const eventById = new Map(
  displayedEvents.map((event) => [event.eventId, event])
)

function hourBoundary(hour: number) {
  return `${String(Math.min(24, Math.max(0, hour))).padStart(2, '0')}:00`
}

function visibleDayBoundaries() {
  const timedEvents = displayedEvents.filter((event) => !event.allDay)
  if (timedEvents.length === 0) return { start: '09:00', end: '20:00' }

  const starts = timedEvents.map((event) =>
    Temporal.Instant.from(event.startAt).toZonedDateTimeISO(calendarTimezone)
  )
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

const timelineEvents: ScheduleXEvent[] = displayedEvents.map((event) => ({
  id: event.eventId,
  title: event.summary,
  start: event.allDay
    ? Temporal.PlainDate.from(event.date)
    : Temporal.Instant.from(event.startAt).toZonedDateTimeISO(calendarTimezone),
  end: event.allDay
    ? allDayEnd(event)
    : Temporal.Instant.from(event.endAt).toZonedDateTimeISO(calendarTimezone),
  description: event.description,
  location: event.location,
  calendarId: 'feishu',
  _options: {
    disableDND: true,
    disableResize: true,
    additionalClasses:
      event.status === 'cancelled' ? ['is-cancelled'] : undefined
  }
}))

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
    feishu: {
      colorName: 'feishu',
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
    }
  },
  callbacks: {
    onEventClick(event) {
      selectedEvent.value = eventById.get(String(event.id)) ?? null
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
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('calendar:open-first', openFirstEvent)
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

        <dl v-if="selectedEvent.location" class="calendar-dialog-details">
          <div>
            <dt>{{ copy.schedule.location }}</dt>
            <dd>
              <EventLocation :location="selectedEvent.location" />
            </dd>
          </div>
        </dl>

        <footer class="calendar-dialog-actions">
          <a v-if="selectedEvent.href" :href="href(selectedEvent.href)">
            {{ copy.schedule.viewNotes }}
          </a>
          <a
            v-if="selectedEvent.meetingUrl"
            :href="selectedEvent.meetingUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ copy.schedule.joinMeeting }}
          </a>
          <a
            v-if="selectedEvent.sourceUrl"
            :href="selectedEvent.sourceUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ copy.schedule.sourceCalendar }}
          </a>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

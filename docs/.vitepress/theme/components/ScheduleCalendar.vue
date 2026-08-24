<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue
} from '@internationalized/date'
import { CalendarRoot } from 'reka-ui'
import {
  isReplayLinkLabel,
  localizedAssignments,
  localizedCalendarEvents,
  visibleLocations,
  type CalendarEvent,
  type CourseAssignment,
  type ScheduleResourceLink
} from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'
import CalendarCell from './ui/calendar/CalendarCell.vue'
import CalendarCellTrigger from './ui/calendar/CalendarCellTrigger.vue'
import CalendarGrid from './ui/calendar/CalendarGrid.vue'
import CalendarGridBody from './ui/calendar/CalendarGridBody.vue'
import CalendarGridHead from './ui/calendar/CalendarGridHead.vue'
import CalendarGridRow from './ui/calendar/CalendarGridRow.vue'
import CalendarHeadCell from './ui/calendar/CalendarHeadCell.vue'
import CalendarHeader from './ui/calendar/CalendarHeader.vue'
import CalendarHeading from './ui/calendar/CalendarHeading.vue'
import CalendarNextButton from './ui/calendar/CalendarNextButton.vue'
import CalendarPrevButton from './ui/calendar/CalendarPrevButton.vue'

const { locale, copy, href } = useSiteLocale()

const displayedEvents = localizedCalendarEvents(locale.value).filter(
  (event) => event.display.calendar
)
const displayedAssignments = localizedAssignments(locale.value).filter(
  (assignment) => assignment.due
)

const selectedEvent = ref<CalendarEvent | null>(null)
const mounted = ref(false)
const now = ref(Date.now())
let clock: number | undefined

type DotKind = 'lecture' | 'guest-lecture' | 'workshop' | 'assignment'

interface DayEntry {
  events: CalendarEvent[]
  assignments: CourseAssignment[]
}

const dayMap = new Map<string, DayEntry>()

function dayEntry(key: string): DayEntry {
  let entry = dayMap.get(key)
  if (!entry) {
    entry = { events: [], assignments: [] }
    dayMap.set(key, entry)
  }
  return entry
}

for (const event of displayedEvents) {
  const start = parseDate(event.date)
  const end =
    event.allDay && event.endDate > event.date
      ? parseDate(event.endDate).subtract({ days: 1 })
      : start
  let cursor = start
  for (let i = 0; i < 62 && cursor.compare(end) <= 0; i += 1) {
    dayEntry(cursor.toString()).events.push(event)
    cursor = cursor.add({ days: 1 })
  }
}

for (const assignment of displayedAssignments) {
  dayEntry(assignment.due!.date).assignments.push(assignment)
}

function dotKind(event: CalendarEvent): DotKind {
  if (event.type === 'guest-lecture') return 'guest-lecture'
  if (event.type === 'workshop') return 'workshop'
  return 'lecture'
}

function dotsFor(day: DateValue): DotKind[] {
  const entry = dayMap.get(day.toString())
  if (!entry) return []
  const kinds = new Set<DotKind>(entry.events.map(dotKind))
  if (entry.assignments.length) kinds.add('assignment')
  return [...kinds].slice(0, 3)
}

const eventById = new Map(
  displayedEvents.map((event) => [event.eventId, event])
)

const todayDate = today(getLocalTimeZone())
const eventDates = displayedEvents.map((event) => event.date).sort()
const firstDate = eventDates[0]
const lastDate = eventDates[eventDates.length - 1]

function clampDate(key: string) {
  if (firstDate && key < firstDate) return firstDate
  if (lastDate && key > lastDate) return lastDate
  return key
}

const initialDate = parseDate(clampDate(todayDate.toString()))
const selectedDate = ref<DateValue>(initialDate)
const placeholder = ref<DateValue>(initialDate)

const selectedDay = computed(
  () => dayMap.get(selectedDate.value.toString()) ?? null
)

const selectedEventLocations = computed(() =>
  selectedEvent.value
    ? visibleLocations(selectedEvent.value, now.value)
    : []
)

const selectedDayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(`${selectedDate.value.toString()}T12:00:00Z`))
)

function typeLabel(event: CalendarEvent) {
  const types = copy.value.schedule.eventTypes
  if (event.type === 'guest-lecture') return types.guestLecture
  if (event.type === 'workshop') return types.workshop
  return types.lecture
}

function statusLabel(status: CalendarEvent['status']) {
  return copy.value.schedule.statuses[status]
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

function speakersLabel(event: CalendarEvent) {
  return (event.speakers ?? []).join(locale.value === 'en' ? ', ' : '、')
}

function materialLinks(event: CalendarEvent): ScheduleResourceLink[] {
  return event.links.filter((link) => !isReplayLinkLabel(link.label))
}

function replayLinks(event: CalendarEvent): ScheduleResourceLink[] {
  return event.links.filter((link) => isReplayLinkLabel(link.label))
}

function linkHref(value: string) {
  return href(value)
}

function isExternal(value: string) {
  return /^https?:\/\//.test(value)
}

function openDialog(event: CalendarEvent) {
  now.value = Date.now()
  selectedEvent.value = event
}

function closeDialog() {
  selectedEvent.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDialog()
}

function openEvent(event: Event) {
  const eventId = (event as CustomEvent<string>).detail
  selectedEvent.value = eventById.get(eventId) ?? null
}

watch(selectedEvent, (event) => {
  document.body.classList.toggle('has-calendar-dialog', Boolean(event))
})

onMounted(() => {
  mounted.value = true
  now.value = Date.now()
  clock = window.setInterval(() => {
    now.value = Date.now()
  }, 30_000)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('calendar:open-event', openEvent)
})

onBeforeUnmount(() => {
  if (clock !== undefined) window.clearInterval(clock)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('calendar:open-event', openEvent)
  document.body.classList.remove('has-calendar-dialog')
})
</script>

<template>
  <section
    id="calendar-timeline"
    class="calendar-panel"
    :aria-label="copy.schedule.calendarAria"
  >
    <div class="calendar-panel-head">
      <h2>{{ copy.schedule.calendarView }}</h2>
      <div class="calendar-type-legend" aria-label="Calendar event types">
        <span class="is-lecture">{{ copy.schedule.eventTypes.lecture }}</span>
        <span class="is-guest-lecture">
          {{ copy.schedule.eventTypes.guestLecture }}
        </span>
        <span class="is-workshop">{{ copy.schedule.eventTypes.workshop }}</span>
        <span class="is-assignment">
          {{ copy.schedule.eventTypes.assignment }}
        </span>
      </div>
    </div>

    <div v-if="mounted" class="calendar-panel-body">
      <CalendarRoot
        v-slot="{ grid, weekDays }"
        v-model="selectedDate"
        v-model:placeholder="placeholder"
        class="schedule-calendar"
        :locale="locale === 'en' ? 'en-US' : 'zh-CN'"
        :week-starts-on="1"
        weekday-format="short"
        fixed-weeks
        prevent-deselect
      >
        <CalendarHeader class="schedule-calendar-header">
          <CalendarHeading class="schedule-calendar-heading" />
          <div class="schedule-calendar-nav">
            <CalendarPrevButton />
            <CalendarNextButton />
          </div>
        </CalendarHeader>
        <CalendarGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="schedule-calendar-grid"
        >
          <CalendarGridHead>
            <CalendarGridRow>
              <CalendarHeadCell v-for="day in weekDays" :key="day">
                {{ day }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody>
            <CalendarGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`week-${index}`"
              class="mt-1 w-full"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
              >
                <CalendarCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  class="schedule-calendar-day"
                >
                  <span class="schedule-calendar-day-number">
                    {{ weekDate.day }}
                  </span>
                  <span
                    v-if="dotsFor(weekDate).length"
                    class="schedule-calendar-dots"
                  >
                    <span
                      v-for="dot in dotsFor(weekDate)"
                      :key="dot"
                      class="schedule-calendar-dot"
                      :class="`is-${dot}`"
                    />
                  </span>
                </CalendarCellTrigger>
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>

      <div class="calendar-day-events">
        <h3>{{ selectedDayLabel }}</h3>
        <p v-if="!selectedDay" class="calendar-day-empty">
          {{ copy.schedule.noEventsOnDay }}
        </p>
        <template v-else>
          <button
            v-for="event in selectedDay.events"
            :key="event.eventId"
            type="button"
            class="calendar-day-event"
            @click="openDialog(event)"
          >
            <span
              class="calendar-day-event-dot"
              :class="`is-${dotKind(event)}`"
            />
            <span class="calendar-day-event-time">{{ event.timeLabel }}</span>
            <span class="calendar-day-event-title">{{ event.summary }}</span>
          </button>
          <a
            v-for="assignment in selectedDay.assignments"
            :key="assignment.id"
            class="calendar-day-event is-assignment"
            :href="href(`/assignments#assignment-${assignment.id}`)"
          >
            <span class="calendar-day-event-dot is-assignment" />
            <span class="calendar-day-event-time">[DDL]</span>
            <span class="calendar-day-event-title">
              {{ assignment.id }} · {{ assignment.title }}
            </span>
          </a>
        </template>
      </div>
    </div>
    <div
      v-else
      class="calendar-timeline-loading"
      role="status"
      aria-live="polite"
    >
      <strong>{{ copy.schedule.loading }}</strong>
    </div>
  </section>

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
          <span
            class="calendar-dialog-type"
            :class="`is-${dotKind(selectedEvent)}`"
          >
            {{ typeLabel(selectedEvent) }}
          </span>
          <span>{{ readableDate(selectedEvent.date) }}</span>
          <span>{{ selectedEvent.timeLabel }}</span>
          <span>{{ statusLabel(selectedEvent.status) }}</span>
        </div>

        <h2 id="calendar-dialog-title">{{ selectedEvent.summary }}</h2>

        <p v-if="selectedEvent.description" class="calendar-dialog-description">
          {{ selectedEvent.description }}
        </p>

        <dl
          v-if="selectedEventLocations.length || selectedEvent.speakers?.length"
          class="calendar-dialog-details"
        >
          <div v-if="selectedEventLocations.length">
            <dt>{{ copy.schedule.location }}</dt>
            <dd>
              <EventLocation :locations="selectedEventLocations" />
            </dd>
          </div>
          <div v-if="selectedEvent.speakers?.length">
            <dt>{{ copy.schedule.speakers }}</dt>
            <dd>{{ speakersLabel(selectedEvent) }}</dd>
          </div>
        </dl>

        <footer
          v-if="selectedEvent.links.length || selectedEvent.assignments.length"
          class="calendar-dialog-actions"
        >
          <div
            v-if="materialLinks(selectedEvent).length"
            class="calendar-dialog-action-row"
          >
            <span class="calendar-dialog-action-label">
              {{ copy.schedule.linkGroups.materials }}
            </span>
            <a
              v-for="link in materialLinks(selectedEvent)"
              :key="link.href"
              :href="linkHref(link.href)"
              :target="isExternal(link.href) ? '_blank' : undefined"
              :rel="isExternal(link.href) ? 'noreferrer' : undefined"
            >
              {{ link.label }}
            </a>
          </div>
          <div
            v-if="replayLinks(selectedEvent).length"
            class="calendar-dialog-action-row"
          >
            <span class="calendar-dialog-action-label">
              {{ copy.schedule.linkGroups.replays }}
            </span>
            <a
              v-for="link in replayLinks(selectedEvent)"
              :key="link.href"
              :href="linkHref(link.href)"
              :target="isExternal(link.href) ? '_blank' : undefined"
              :rel="isExternal(link.href) ? 'noreferrer' : undefined"
            >
              {{ link.label }}
            </a>
          </div>
          <div
            v-if="selectedEvent.assignments.length"
            class="calendar-dialog-action-row"
          >
            <span class="calendar-dialog-action-label">
              {{ copy.schedule.linkGroups.assignments }}
            </span>
            <a
              v-for="assignment in selectedEvent.assignments"
              :key="assignment.id"
              class="calendar-dialog-assignment"
              :href="href(assignment.href)"
            >
              {{ assignment.id }} · {{ assignment.title }}
            </a>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

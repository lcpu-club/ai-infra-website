<script setup lang="ts">
import { withBase } from 'vitepress'
import { scheduleEventCount } from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import CalendarTimeline from './CalendarTimeline.vue'
import ScheduleTable from './ScheduleTable.vue'

const { copy } = useSiteLocale()

function openFirstEvent() {
  window.dispatchEvent(new CustomEvent('calendar:open-first'))
}
</script>

<template>
  <main class="course-site schedule-page-shell">
    <header class="schedule-page-header">
      <h1>{{ copy.schedule.title }}</h1>
      <div class="schedule-page-actions">
        <a :href="withBase('/calendar.ics')" download>
          {{ copy.schedule.downloadCalendar }}
        </a>
        <button
          v-if="scheduleEventCount"
          type="button"
          @click="openFirstEvent"
        >
          {{ copy.schedule.firstEvent }}
        </button>
      </div>
    </header>

    <section id="full-schedule" class="calendar-list-section">
      <h2>{{ copy.schedule.allEvents }}</h2>
      <ScheduleTable />
    </section>

    <CalendarTimeline v-if="scheduleEventCount" />
  </main>
</template>

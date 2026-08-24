<script setup lang="ts">
import { withBase } from 'vitepress'
import { scheduleEventCount } from '../../data/schedule'
import { useSiteLocale } from '../../data/site-i18n'
import ScheduleCalendar from './ScheduleCalendar.vue'
import ScheduleTable from './ScheduleTable.vue'

const { copy } = useSiteLocale()
</script>

<template>
  <main class="course-site schedule-page-shell">
    <header v-reveal class="schedule-page-header">
      <h1>{{ copy.schedule.title }}</h1>
      <div class="schedule-page-actions">
        <a :href="withBase('/calendar.ics')" download>
          {{ copy.schedule.downloadCalendar }}
        </a>
      </div>
    </header>

    <div class="schedule-layout">
      <aside v-if="scheduleEventCount" v-reveal="100" class="schedule-calendar-aside">
        <ScheduleCalendar />
      </aside>

      <section id="full-schedule" class="calendar-list-section">
        <h2>{{ copy.schedule.allEvents }}</h2>
        <ScheduleTable />
      </section>
    </div>
  </main>
</template>

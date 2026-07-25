<script setup lang="ts">
import { calendarEvents } from '../../data/program'
import CalendarTimeline from './CalendarTimeline.vue'
import ScheduleTable from './ScheduleTable.vue'

function openFirstEvent() {
  window.dispatchEvent(new CustomEvent('calendar:open-first'))
}
</script>

<template>
  <main class="course-site schedule-page-shell">
    <header class="schedule-page-header">
      <h1>课程日历</h1>
      <button
        v-if="calendarEvents.length"
        type="button"
        @click="openFirstEvent"
      >
        回到首场活动
      </button>
    </header>

    <CalendarTimeline v-if="calendarEvents.length" />

    <section id="full-schedule" class="calendar-list-section">
      <h2>全部安排</h2>
      <ScheduleTable />
    </section>
  </main>
</template>

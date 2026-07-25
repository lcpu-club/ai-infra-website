<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSiteLocale } from '../../data/site-i18n'
import CalendarTimelineClient from './CalendarTimelineClient.vue'

const mounted = ref(false)
const { copy } = useSiteLocale()

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <section
    id="calendar-timeline"
    class="calendar-timeline-section"
    :aria-label="copy.schedule.calendarAria"
  >
    <div class="calendar-timeline-shell">
      <CalendarTimelineClient v-if="mounted" />
      <div
        v-else
        class="calendar-timeline-loading"
        role="status"
        aria-live="polite"
      >
        <strong>{{ copy.schedule.loading }}</strong>
        <p>{{ copy.schedule.loadingHint }}</p>
      </div>
    </div>
  </section>
</template>

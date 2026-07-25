<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CalendarTimelineClient from './CalendarTimelineClient.vue'

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <section
    id="calendar-timeline"
    class="calendar-timeline-section"
    aria-label="交互式课程日历"
  >
    <div class="calendar-timeline-shell">
      <CalendarTimelineClient v-if="mounted" />
      <div
        v-else
        class="calendar-timeline-loading"
        role="status"
        aria-live="polite"
      >
        <strong>正在加载交互日历…</strong>
        <p>下方日程列表会始终保留。</p>
      </div>
    </div>
  </section>
</template>

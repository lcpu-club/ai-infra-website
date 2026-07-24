<script setup lang="ts">
import { withBase } from 'vitepress'
import ScheduleTable from './ScheduleTable.vue'
</script>

<template>
  <main class="course-site schedule-page-shell">
    <header class="inner-page-hero">
      <span>AI INFRA SEMINARS</span>
      <h1>完整课程日程</h1>
      <p>
        2026 年 7 月 23 日至 9 月 6 日，共七周、四个 Topic、十四场
        Session。日期、时间和地点由课程共享飞书日历自动同步。
      </p>
      <a :href="withBase('/')">← 返回课程首页</a>
    </header>
    <ScheduleTable id="full-schedule" />
  </main>
</template>

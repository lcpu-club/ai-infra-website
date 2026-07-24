<script setup lang="ts">
import { withBase } from 'vitepress'
import {
  calendarEvents,
  calendarTimezone
} from '../../data/program'
import ScheduleTable from './ScheduleTable.vue'

function shortDate(value: string) {
  return value.slice(5).replace('-', '.')
}

const eventRange =
  calendarEvents.length > 0
    ? `${shortDate(calendarEvents[0].date)} — ${shortDate(
        calendarEvents.at(-1)!.date
      )}`
    : '等待日程'
const calendarTimezoneLabel =
  {
    'Asia/Shanghai': '北京时间',
    'Asia/Singapore': '新加坡时间'
  }[calendarTimezone] || calendarTimezone
</script>

<template>
  <main class="course-site schedule-page-shell">
    <header class="inner-page-hero calendar-page-hero">
      <span>AI INFRA SEMINARS</span>
      <h1>活动日历</h1>
      <p>
        本页直接同步 AI Infra 共享飞书日历。新建活动、修改时间与地点、
        补充说明或取消日程后，网站会自动更新。
      </p>
      <dl class="calendar-sync-summary">
        <div>
          <dt>已同步</dt>
          <dd>{{ calendarEvents.length }} 项</dd>
        </div>
        <div>
          <dt>当前范围</dt>
          <dd>{{ eventRange }}</dd>
        </div>
        <div>
          <dt>显示时区</dt>
          <dd>{{ calendarTimezoneLabel }}</dd>
        </div>
      </dl>
      <a :href="withBase('/')">← 返回课程首页</a>
    </header>
    <section id="full-schedule">
      <ScheduleTable />
    </section>
  </main>
</template>

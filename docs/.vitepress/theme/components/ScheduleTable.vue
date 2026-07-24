<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { sessions, topics } from '../../data/program'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const today = ref(dateFormatter.format(new Date()))

onMounted(() => {
  today.value = dateFormatter.format(new Date())
})

const nextSessionId = computed(
  () => sessions.find((session) => session.date >= today.value)?.id
)

function topicFor(key: string) {
  return topics.find((topic) => topic.key === key)!
}

function statusFor(date: string, id: string) {
  if (date < today.value) return 'past'
  if (date === today.value) return 'today'
  if (id === nextSessionId.value) return 'next'
  return 'upcoming'
}

function statusLabel(status: string) {
  return {
    past: '已结束',
    today: '今天',
    next: '下一场',
    upcoming: ''
  }[status]
}
</script>

<template>
  <div class="schedule-table-wrap">
    <table class="course-schedule-table">
      <caption>AI Infrastructure Seminars 2026 课程日程</caption>
      <colgroup>
        <col class="schedule-col-date" />
        <col class="schedule-col-topic" />
        <col class="schedule-col-session" />
        <col class="schedule-col-owner" />
        <col class="schedule-col-material" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">日期</th>
          <th scope="col">主题</th>
          <th scope="col">Session 内容</th>
          <th scope="col">分享</th>
          <th scope="col">资料</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="session in sessions"
          :id="`session-${session.id}`"
          :key="session.id"
          :class="`is-${statusFor(session.date, session.id)}`"
        >
          <td class="schedule-date-cell">
            <time :datetime="session.date">
              <strong>{{ session.dateLabel }}</strong>
              <span>{{ session.week }}</span>
            </time>
          </td>
          <td class="schedule-topic-cell">
            <span>Topic {{ topicFor(session.topic).number }}</span>
            <strong>{{ topicFor(session.topic).shortTitle }}</strong>
          </td>
          <th class="schedule-session-cell" scope="row">
            <div class="schedule-session-meta">
              <span>Session {{ session.id }}</span>
              <span
                v-if="statusLabel(statusFor(session.date, session.id))"
                class="schedule-session-state"
              >
                {{ statusLabel(statusFor(session.date, session.id)) }}
              </span>
            </div>
            <h4>
              <a v-if="session.href" :href="withBase(session.href)">{{ session.title }}</a>
              <template v-else>{{ session.title }}</template>
            </h4>
            <ul>
              <li v-for="item in session.items" :key="item">{{ item }}</li>
            </ul>
            <div class="schedule-session-mobile-meta">
              <span>
                Topic {{ topicFor(session.topic).number }} ·
                {{ topicFor(session.topic).shortTitle }}
              </span>
              <span>分享：{{ session.owners.join(' · ') }}</span>
              <a v-if="session.href" :href="withBase(session.href)">查看资料</a>
              <span v-else>资料准备中</span>
            </div>
          </th>
          <td class="schedule-owner-cell">
            {{ session.owners.join(' · ') }}
          </td>
          <td class="schedule-material-cell">
            <a v-if="session.href" :href="withBase(session.href)">查看资料</a>
            <span v-else>准备中</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

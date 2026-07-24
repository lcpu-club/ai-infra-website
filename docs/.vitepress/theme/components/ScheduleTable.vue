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

const groups = computed(() =>
  topics.map((topic) => ({
    topic,
    sessions: sessions.filter((session) => session.topic === topic.key)
  }))
)

const nextSessionId = computed(
  () => sessions.find((session) => session.date >= today.value)?.id
)

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
  <div class="schedule-groups">
    <section
      v-for="group in groups"
      :key="group.topic.key"
      class="schedule-group"
      :data-topic="group.topic.key"
    >
      <header class="schedule-group-header">
        <span class="schedule-group-index">{{ group.topic.number }}</span>
        <div>
          <p>TOPIC {{ group.topic.number }}</p>
          <h3>{{ group.topic.title }}</h3>
        </div>
        <span class="schedule-count">
          {{ group.sessions.length }} SESSIONS
        </span>
      </header>

      <div class="session-rows">
        <article
          v-for="session in group.sessions"
          :id="`session-${session.id}`"
          :key="session.id"
          class="session-row"
          :class="`is-${statusFor(session.date, session.id)}`"
        >
          <time class="session-row-date" :datetime="session.date">
            <strong>{{ session.dateLabel }}</strong>
            <span>{{ session.week }}</span>
          </time>

          <div class="session-row-main">
            <div class="session-row-meta">
              <span>SESSION {{ session.id }}</span>
              <span
                v-if="statusLabel(statusFor(session.date, session.id))"
                class="session-state"
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
          </div>

          <aside class="session-row-aside">
            <span>分享</span>
            <strong>{{ session.owners.join(' · ') }}</strong>
            <a v-if="session.href" :href="withBase(session.href)">查看资料 →</a>
            <small v-else>资料准备中</small>
          </aside>
        </article>
      </div>
    </section>
  </div>
</template>

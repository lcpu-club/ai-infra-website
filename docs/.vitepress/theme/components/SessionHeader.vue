<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { sessions, topicFor } from '../../data/program'

const props = defineProps<{
  sessionId: string
}>()

const session = sessions.find(({ id }) => id === props.sessionId)
if (!session) {
  throw new Error(`Unknown course session: ${props.sessionId}`)
}

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

const status = computed(() => {
  if (session.calendarStatus === 'cancelled') return '已取消'
  if (session.date < today.value) return '已结束'
  if (session.date === today.value) return '今天'
  return '即将开始'
})

const topic = topicFor(session.topic)
</script>

<template>
  <header class="session-banner">
    <span class="section-index">
      主题 {{ topic.number }} · 第 {{ session.id }} 讲 · {{ session.dateLabel }}
      <template v-if="session.timeLabel"> · {{ session.timeLabel }}</template>
    </span>
    <h1>{{ session.title }}</h1>
    <p>{{ session.items.join('；') }}</p>
    <div class="session-banner-meta">
      <span>状态 · {{ status }}</span>
      <span>分享 · {{ session.owners.join(' · ') }}</span>
      <span v-if="session.location">地点 · {{ session.location }}</span>
      <span v-else>形式 · 预习 + 分享 + 讨论</span>
      <a
        v-if="session.meetingUrl"
        :href="session.meetingUrl"
        target="_blank"
        rel="noreferrer"
      >
        加入会议 ↗
      </a>
    </div>
  </header>
</template>

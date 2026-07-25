<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { sessions, topicFor } from '../../data/program'
import {
  localizedTopics,
  useSiteLocale
} from '../../data/site-i18n'
import EventLocation from './EventLocation.vue'

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
const { locale, copy } = useSiteLocale()

onMounted(() => {
  today.value = dateFormatter.format(new Date())
})

const status = computed(() => {
  if (session.calendarStatus === 'cancelled') {
    return copy.value.session.statuses.cancelled
  }
  if (session.date < today.value) return copy.value.session.statuses.ended
  if (session.date === today.value) return copy.value.session.statuses.today
  return copy.value.session.statuses.upcoming
})

const topic = computed(
  () => localizedTopics([topicFor(session.topic)], locale.value)[0]
)
</script>

<template>
  <header class="session-banner">
    <span class="section-index">
      {{ copy.session.topic }} {{ topic.number }} · {{ copy.session.lecture }} {{ session.id }} · {{ session.dateLabel }}
      <template v-if="session.timeLabel"> · {{ session.timeLabel }}</template>
    </span>
    <h1>{{ session.title }}</h1>
    <p>{{ session.items.join('；') }}</p>
    <div class="session-banner-meta">
      <span>{{ copy.session.status }} · {{ status }}</span>
      <span>{{ copy.session.speakers }} · {{ session.owners.join(' · ') }}</span>
      <span v-if="session.location">
        {{ copy.session.location }} · <EventLocation :location="session.location" />
      </span>
      <span v-else>{{ copy.session.format }} · {{ copy.session.formatValue }}</span>
      <a
        v-if="session.meetingUrl"
        :href="session.meetingUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ copy.session.joinMeeting }}
      </a>
    </div>
  </header>
</template>

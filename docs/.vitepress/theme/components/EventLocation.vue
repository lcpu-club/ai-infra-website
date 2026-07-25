<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  location: string
}>()

const showLcpuLive = computed(
  () =>
    (props.location.includes('腾讯会议') &&
      props.location.includes('B站直播')) ||
    (props.location.includes('Tencent Meeting') &&
      props.location.includes('Bilibili Live'))
)
</script>

<template>
  <span class="event-location">
    {{ location }}
    <template v-if="showLcpuLive">
      ·
      <a
        class="event-location-live"
        href="https://live.lcpu.dev"
        target="_blank"
        rel="noreferrer"
      >LCPU Live</a>
    </template>
  </span>
</template>

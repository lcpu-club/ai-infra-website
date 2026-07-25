<script setup lang="ts">
const props = defineProps<{
  location: string
}>()

const showLcpuLive =
  props.location.includes('腾讯会议') &&
  props.location.includes('B站直播')
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

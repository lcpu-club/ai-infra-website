<script setup lang="ts">
import { withBase } from 'vitepress'
import type { ScheduleLocation } from '../../data/schedule'

defineProps<{
  locations: ScheduleLocation[]
}>()

function locationHref(href: string) {
  return /^https?:\/\//.test(href) ? href : withBase(href)
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}
</script>

<template>
  <span class="event-location">
    <template
      v-for="(location, index) in locations"
      :key="`${location.label}-${location.href ?? index}`"
    >
      <template v-if="index"> · </template>
      <a
        v-if="location.href"
        :href="locationHref(location.href)"
        :target="isExternal(location.href) ? '_blank' : undefined"
        :rel="isExternal(location.href) ? 'noreferrer' : undefined"
      >{{ location.label }}</a>
      <template v-else>{{ location.label }}</template>
    </template>
  </span>
</template>

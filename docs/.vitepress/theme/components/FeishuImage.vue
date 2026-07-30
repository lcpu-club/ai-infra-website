<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  src: string
  caption?: string
  width?: string
  height?: string
  transparent?: boolean
}>()

const resolvedSrc = computed(() =>
  props.src.startsWith('/') ? withBase(props.src) : props.src
)
</script>

<template>
  <figure class="feishu-figure">
    <div
      class="feishu-image-frame"
      :class="{ 'is-transparent': transparent }"
    >
      <img
        :src="resolvedSrc"
        :alt="caption || ''"
        :width="width"
        :height="height"
        loading="lazy"
        decoding="async"
      >
    </div>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

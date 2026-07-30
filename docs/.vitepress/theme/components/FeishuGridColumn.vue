<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

const props = defineProps<{
  width?: string
}>()

const columnStyle = computed<CSSProperties>(() => ({
  '--feishu-column-width': props.width || '1'
}))
</script>

<template>
  <div class="feishu-grid-column" :style="columnStyle">
    <slot />
  </div>
</template>

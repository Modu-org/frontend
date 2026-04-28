<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  padding: { type: String, default: 'md' },
  hoverable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  elevated: { type: Boolean, default: false },
})

/* Design Guide 5 — Cards:
   - No dividers, use 16px whitespace
   - 16px corner radius (DEFAULT)
   - surface-container-lowest on surface background
   - Ghost border (outline-variant at 15% opacity) */
const classes = computed(() => [
  'bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-DEFAULT)]',
  'transition-all duration-300 ease-out',
  props.elevated ? 'sunlight-shadow' : 'ghost-border',
  {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[props.padding],
  props.hoverable && 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1',
  props.clickable && 'cursor-pointer active:scale-[0.98]',
])
</script>

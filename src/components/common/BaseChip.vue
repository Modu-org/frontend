<template>
  <span
    :class="classes"
    :aria-pressed="selected ? 'true' : undefined"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selected: { type: Boolean, default: false },
})

defineEmits(['click'])

/* Design Guide 5 — Accessibility Chips (adapted for general chips):
   - md roundedness (1.5rem = 24px)
   - selected: primary border + tint bg
   - unselected: ghost-border */
const classes = computed(() => [
  'inline-flex items-center gap-2 px-6 py-3 rounded-[24px] cursor-pointer select-none',
  'text-[var(--font-size-sm)] font-bold tracking-tight',
  'transition-all duration-300 ease-out active:scale-95',
  'min-h-[var(--touch-min)]',
  props.selected
    ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5 sunlight-shadow'
    : 'border-2 border-[var(--color-outline-variant)]/15 text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]',
])
</script>

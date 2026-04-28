<template>
  <span
    :class="classes"
    :title="label"
    :aria-label="label"
    role="img"
  >
    <span class="material-symbols-outlined text-[16px]" aria-hidden="true" :style="iconStyle">{{ iconName }}</span>
    <span class="text-[var(--font-size-xs)] font-bold">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
})

/* Design Guide 5 — Accessibility Chips:
   - Soft green (secondary-fixed-dim) bg with on-secondary-fixed text
   - Shape: md roundedness (1.5rem)
   - Thick-stroke icon */
const BADGE_MAP = {
  wheelchairAccessible: { icon: 'accessible_forward', label: '휠체어 가능' },
  strollerAccessible: { icon: 'stroller', label: '유모차 가능' },
  disabledRestroom: { icon: 'wc', label: '장애인 화장실' },
  elevatorAvailable: { icon: 'elevator', label: '엘리베이터' },
  rampAvailable: { icon: 'trending_up', label: '경사로' },
}

const badge = computed(() => BADGE_MAP[props.type] || { icon: 'check_circle', label: props.type })
const iconName = computed(() => badge.value.icon)
const label = computed(() => badge.value.label)
const iconStyle = "font-variation-settings: 'FILL' 1, 'wght' 600;"

const classes = computed(() => [
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)]',
  'bg-[var(--color-secondary-fixed-dim)]/20 text-[var(--color-on-secondary-fixed)]',
  'text-[var(--font-size-xs)] font-bold',
])
</script>

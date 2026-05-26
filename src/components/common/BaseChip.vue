<template>
  <span
    :class="['chip', { 'chip--selected': selected, 'chip--icon': icon }]"
    :aria-pressed="selected ? 'true' : 'false'"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <span v-if="icon" class="material-symbols-outlined chip__icon" style="font-variation-settings: 'FILL' 1;">
      {{ icon }}
    </span>
    <slot />
  </span>
</template>

<script setup>
defineProps({
  selected: { type: Boolean, default: false },
  icon: { type: String, default: '' },
})
defineEmits(['click'])
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.125rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s;
  min-height: var(--touch-min);
  white-space: nowrap;

  /* 기본: 면 중심 — 배경으로 구분 */
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  border: none;
}

.chip:hover {
  background: var(--color-primary-200);
}

.chip:active { transform: scale(0.96); }

/* 선택됨 */
.chip--selected {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.chip--selected:hover {
  background: var(--color-primary-hover);
}

.chip__icon {
  font-size: 1.1em;
  line-height: 1;
}
</style>

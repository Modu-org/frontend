<template>
  <div
    :class="[
      'card',
      `card--pad-${padding}`,
      { 'card--hoverable': hoverable, 'card--clickable': clickable }
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  padding: { type: String, default: 'md' },
  hoverable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  elevated: { type: Boolean, default: false },  // 하위 호환 유지
})
</script>

<style scoped>
/* 면 중심 UI — shadow 지양, border로 구분 */
.card {
  background: var(--color-surface-container-lowest);
  border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant);
  transition: border-color 0.18s, transform 0.12s;
}

.card--pad-sm  { padding: 0.75rem; }
.card--pad-md  { padding: 1.25rem; }
.card--pad-lg  { padding: 1.75rem; }
.card--pad-xl  { padding: 2rem; }

.card--hoverable:hover {
  border-color: var(--color-primary-300);
  transform: translateY(-2px);
}
.card--clickable { cursor: pointer; }
.card--clickable:active { transform: scale(0.99); }
</style>

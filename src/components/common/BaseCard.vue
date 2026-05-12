<template>
  <div :class="['card', { 'card--elevated': elevated, 'card--hoverable': hoverable, 'card--clickable': clickable }, `card--pad-${padding}`]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  padding: { type: String, default: 'md' },
  hoverable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  elevated: { type: Boolean, default: false },
})
</script>

<style scoped>
.card {
  background: var(--color-surface-container-lowest);
  border-radius: var(--radius-DEFAULT);
  transition: all 0.2s ease;
}
.card:not(.card--elevated) { border: 2px solid rgba(191,199,210,.15); }
.card--elevated { box-shadow: var(--shadow-lg); }

.card--pad-sm { padding: 12px; }
.card--pad-md { padding: 20px; }
.card--pad-lg { padding: 28px; }

.card--hoverable:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.card--clickable { cursor: pointer; }
.card--clickable:active { transform: scale(0.99); }
</style>

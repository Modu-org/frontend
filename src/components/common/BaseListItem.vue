<template>
  <div class="list-item" :class="{ 'list-item--clickable': clickable }" @click="clickable && $emit('click')">
    <div v-if="$slots.leading" class="list-item__leading"><slot name="leading" /></div>
    <div class="list-item__content">
      <p class="list-item__title"><slot /></p>
      <p v-if="$slots.subtitle" class="list-item__subtitle"><slot name="subtitle" /></p>
    </div>
    <div v-if="$slots.trailing" class="list-item__trailing"><slot name="trailing" /></div>
  </div>
</template>

<script setup>
defineProps({ clickable: { type: Boolean, default: false } })
defineEmits(['click'])
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-DEFAULT);
  transition: background 0.15s;
}
.list-item--clickable { cursor: pointer; }
.list-item--clickable:hover { background: var(--color-surface-container); }

.list-item__leading { flex-shrink: 0; }
.list-item__content { flex: 1; min-width: 0; }
.list-item__title { font-size: var(--font-size-base); font-weight: 600; color: var(--color-on-surface); }
.list-item__subtitle { font-size: var(--font-size-sm); color: var(--color-outline); margin-top: 2px; }
.list-item__trailing { flex-shrink: 0; }
</style>

<template>
  <div class="loading-wrap" role="status" aria-label="로딩 중">
    <div class="loading-ring">
      <div class="loading-ring__track" />
      <div class="loading-ring__spin" />
    </div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '데이터를 불러오고 있습니다.'
  }
})
</script>

<style scoped>
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
}
.loading-ring {
  position: relative;
  width: 40px;
  height: 40px;
}
.loading-ring__track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3.5px solid var(--color-primary-fixed, #dce8c7);
  opacity: 0.35;
}
.loading-ring__spin {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3.5px solid transparent;
  border-top-color: var(--color-primary, #7BA23F);
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: var(--font-size-sm, 0.8125rem);
  font-weight: 600;
  color: var(--color-on-surface-variant, #666);
}
</style>

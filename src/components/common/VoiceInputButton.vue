<template>
  <button
    :class="fabClasses"
    :aria-label="isListening ? '음성 인식 중지' : '음성으로 말하기'"
    :aria-pressed="isListening"
    @click="toggle"
  >
    <div v-if="isListening" class="absolute inset-0 rounded-full animate-ping bg-[var(--color-primary)] opacity-20" />
    <div v-if="isListening" class="absolute inset-[-4px] rounded-full animate-pulse border-2 border-[var(--color-primary)] opacity-40" />
    <svg class="w-7 h-7 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path v-if="!isListening" stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      <path v-else stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isListening: { type: Boolean, default: false },
  fixed: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle'])

function toggle() {
  emit('toggle')
}

const fabClasses = computed(() => [
  'relative inline-flex items-center justify-center rounded-full shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)]',
  'w-[var(--fab-size)] h-[var(--fab-size)]',
  props.isListening
    ? 'bg-[var(--color-danger)] text-white scale-110'
    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:scale-105',
  props.fixed && 'fixed bottom-[calc(var(--bottom-nav-height)+var(--space-md))] right-[var(--space-md)] z-40',
])
</script>

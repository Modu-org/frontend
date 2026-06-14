<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container" aria-live="polite">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.type}`]"
        role="status"
      >
        <span class="material-symbols-outlined toast__icon" style="font-variation-settings: 'FILL' 1;">
          {{ iconMap[toast.type] || 'info' }}
        </span>
        <span class="toast__msg">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const iconMap = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}
</script>

<style scoped>
.toast-container {
  position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 8px;
  pointer-events: none; width: 90%; max-width: 400px;
}

.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: var(--radius-DEFAULT);
  background: var(--color-primary); color: #fff;
  font-size: var(--font-size-sm); font-weight: 600;
  box-shadow: var(--shadow-lg); pointer-events: auto;
}
.toast--success { background: #2E7D52; color: #fff; }
.toast--error   { background: var(--color-error); color: #fff; }
.toast--warning { background: #E8A317; color: #1C1B18; }

.toast__icon { font-size: 20px; flex-shrink: 0; }
.toast__msg { flex: 1; }

.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-16px); }
.toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }
</style>

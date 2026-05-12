<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-overlay" aria-hidden="true" />
        <div ref="modalRef" :class="['modal-content', `modal--${size}`]" role="dialog" :aria-label="title" aria-modal="true">
          <div v-if="title" class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
            <button class="modal-close" aria-label="닫기" @click="close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="modal-body"><slot /></div>
          <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAccessibility } from '@/composables/useAccessibility'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue'])
const modalRef = ref(null)
const { trapFocus } = useAccessibility()

watch(() => props.modelValue, (open) => {
  if (open && modalRef.value) trapFocus(modalRef.value)
})

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-md);
}
.modal-overlay {
  position: absolute; inset: 0;
  background: rgba(33,49,69,.4);
  backdrop-filter: blur(4px);
}
.modal-content {
  position: relative;
  background: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  width: 100%;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}
.modal--sm { max-width: 24rem; }
.modal--md { max-width: 32rem; }
.modal--lg { max-width: 42rem; }

.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 12px; }
.modal-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-on-surface); }
.modal-close {
  padding: 8px; border-radius: var(--radius-DEFAULT); border: none; background: none; cursor: pointer;
  color: var(--color-outline); transition: background 0.15s;
}
.modal-close:hover { background: var(--color-surface-container); }
.modal-body { padding: 0 24px 24px; }
.modal-footer { padding: 0 24px 24px; }

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content, .modal-leave-to .modal-content { transform: scale(0.95) translateY(8px); }
</style>

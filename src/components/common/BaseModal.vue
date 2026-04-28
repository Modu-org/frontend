<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-[var(--space-md)]"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[var(--color-inverse-surface)]/40 backdrop-blur-sm" aria-hidden="true" />

        <!-- Modal Content -->
        <div
          ref="modalRef"
          class="relative bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] w-full sunlight-shadow overflow-hidden"
          :class="sizeClass"
          role="dialog"
          :aria-label="title"
          aria-modal="true"
        >
          <!-- Header -->
          <div v-if="title" class="flex items-center justify-between p-6 pb-4">
            <h2 class="text-[var(--font-size-xl)] font-extrabold text-[var(--color-on-surface)] tracking-tight">{{ title }}</h2>
            <button
              class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors"
              aria-label="닫기"
              @click="close"
            >
              <span class="material-symbols-outlined text-[var(--color-outline)]">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 pb-6">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 pb-6">
            <slot name="footer" />
          </div>
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

const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
const sizeClass = sizeMap[props.size] || sizeMap.md

const { trapFocus } = useAccessibility()

watch(() => props.modelValue, (open) => {
  if (open && modalRef.value) trapFocus(modalRef.value)
})

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from :deep([role="dialog"]), .modal-leave-to :deep([role="dialog"]) { transform: scale(0.95) translateY(10px); }
</style>

<template>
  <BaseModal v-model="open" :title="title" size="sm">
    <p class="dialog-message">{{ message }}</p>
    <template #footer>
      <div class="dialog-actions">
        <BaseButton v-if="showCancel" variant="ghost" @click="handleCancel">{{ cancelText }}</BaseButton>
        <BaseButton :variant="confirmVariant" @click="handleConfirm">{{ confirmText }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
  showCancel: { type: Boolean, default: true },
  confirmVariant: { type: String, default: 'primary' },
})

const emit = defineEmits(['confirm', 'cancel'])
const open = defineModel({ type: Boolean, default: false })

function handleConfirm() { emit('confirm'); open.value = false }
function handleCancel() { emit('cancel'); open.value = false }
</script>

<style scoped>
.dialog-message { font-size: var(--font-size-base); color: var(--color-on-surface-variant); line-height: 1.6; }
.dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
</style>

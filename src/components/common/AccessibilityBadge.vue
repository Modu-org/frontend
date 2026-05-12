<template>
  <span :class="['badge', `badge--${statusColor}`]">
    <span class="material-symbols-outlined badge__icon">{{ iconName }}</span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ACCESSIBILITY_SUMMARY_FIELDS, ACCESSIBILITY_STATUS } from '@/constants/accessibility'

const props = defineProps({
  /** accessibilitySummary 키 (wheelchair, stroller 등) */
  type: { type: String, required: true },
  /** AVAILABLE, UNAVAILABLE, UNKNOWN 등 */
  status: { type: String, default: 'UNKNOWN' },
})

const field = computed(() => ACCESSIBILITY_SUMMARY_FIELDS.find((f) => f.key === props.type))
const label = computed(() => field.value?.label || props.type)
const iconName = computed(() => field.value?.icon || 'info')

const statusColor = computed(() => {
  if (props.status === ACCESSIBILITY_STATUS.AVAILABLE) return 'available'
  if (props.status === ACCESSIBILITY_STATUS.UNAVAILABLE) return 'unavailable'
  return 'unknown'
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge__icon { font-size: 14px; }

.badge--available { background: rgba(0,109,65,.1); color: #006D41; }
.badge--unavailable { background: rgba(186,26,26,.1); color: var(--color-error); }
.badge--unknown { background: var(--color-surface-container); color: var(--color-outline); }
</style>

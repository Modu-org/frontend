<template>
  <div class="flex flex-col gap-2">
    <label
      v-if="label"
      :for="inputId"
      class="text-[var(--font-size-sm)] font-semibold text-[var(--color-on-surface-variant)] tracking-tight"
    >
      {{ label }}
      <span v-if="required" class="text-[var(--color-error)]" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <input
        :id="inputId"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="!!error"
        :class="inputClasses"
        v-bind="$attrs"
      />
      <slot name="suffix" />
    </div>
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="text-[var(--font-size-xs)] text-[var(--color-error)] font-medium"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const model = defineModel({ type: String, default: '' })
const inputId = useId()

/* Minimalist input per Design Guide 5:
   - No bottom line, use surface-container-low as fill
   - Ghost border on focus with primary glow */
const inputClasses = computed(() => [
  'w-full px-5 rounded-[var(--radius-DEFAULT)] bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] transition-all duration-300',
  'min-h-[var(--btn-height)] text-[var(--font-size-base)] font-medium',
  'placeholder:text-[var(--color-outline)] placeholder:font-normal',
  'border-2 border-transparent',
  'focus:outline-none focus:border-[var(--color-primary)]/40 focus:shadow-[0_0_0_4px_rgba(0,97,150,0.1)]',
  props.error && 'border-[var(--color-error)]/40',
  props.disabled && 'opacity-40 cursor-not-allowed',
])
</script>

<template>
  <div class="input-group">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-wrap">
      <input
        :id="inputId"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="!!error"
        :class="['input-field', { 'input-field--error': error, 'input-field--disabled': disabled }]"
        v-bind="$attrs"
      />
      <slot name="suffix" />
    </div>
    <p v-if="error" :id="`${inputId}-error`" class="input-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const model = defineModel({ type: [String, Number], default: '' })
const inputId = useId()
</script>

<style scoped>
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-on-surface-variant); }
.input-required { color: var(--color-error); }
.input-wrap { position: relative; }

.input-field {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-surface-container-low);
  color: var(--color-on-surface);
  font-size: var(--font-size-base);
  font-weight: 500;
  border: 2px solid transparent;
  min-height: var(--btn-height);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-field::placeholder { color: var(--color-outline); font-weight: 400; }
.input-field:focus { outline: none; border-color: rgba(0,97,150,.4); box-shadow: 0 0 0 4px rgba(0,97,150,.1); }
.input-field--error { border-color: rgba(186,26,26,.4); }
.input-field--disabled { opacity: 0.4; cursor: not-allowed; }

.input-error { font-size: var(--font-size-xs); color: var(--color-error); font-weight: 500; }
</style>

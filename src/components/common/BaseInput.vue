<template>
  <div class="input-group">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required" aria-hidden="true">*</span>
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
    <p v-if="error" :id="`${inputId}-error`" class="input-error" role="alert">
      <span class="material-symbols-outlined" style="font-size:1em;vertical-align:middle;">error</span>
      {{ error }}
    </p>
    <p v-if="hint && !error" class="input-hint">{{ hint }}</p>
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
  hint: { type: String, default: '' },
})

const model = defineModel({ type: [String, Number], default: '' })
const inputId = useId()
</script>

<style scoped>
.input-group { display: flex; flex-direction: column; gap: 0.4rem; }

.input-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-on-surface);
}
.input-required { color: var(--color-error-deep); margin-left: 2px; }

.input-wrap { position: relative; }

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-surface-container-low);
  color: var(--color-on-surface);
  font-family: inherit;
  font-size: var(--font-size-body);
  font-weight: 500;
  border: 2px solid var(--color-outline-variant);
  min-height: var(--btn-height);
  transition: border-color 0.18s;
  outline: none;
}
.input-field::placeholder {
  color: var(--color-outline);
  font-weight: 400;
}
.input-field:focus {
  border-color: var(--color-primary);
}
.input-field--error { border-color: var(--color-error); }
.input-field--disabled { opacity: 0.45; cursor: not-allowed; }

/* 에러: 색상 단독 금지 → 아이콘 함께 */
.input-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-size-xs);
  color: var(--color-error-deep);
  font-weight: 600;
}

.input-hint {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
}
</style>

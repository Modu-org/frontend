<template>
  <button
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--full': fullWidth }]"
    :disabled="disabled || loading"
    :type="type"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-DEFAULT);
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  white-space: nowrap;
  letter-spacing: -0.01em;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }

/* Sizes */
.btn--sm {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
  min-height: var(--touch-min);
}
.btn--md {
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-body);
  min-height: var(--btn-height);
}
.btn--lg {
  padding: 0.875rem 2rem;
  font-size: var(--font-size-xl);
  min-height: var(--btn-height);
}

/* Variants */
/* Primary: #AAC67B / hover #8EAA61 */
.btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

/* Secondary: white bg + primary border + deep text */
.btn--secondary {
  background: #FFFFFF;
  color: var(--color-primary-deep);
  border: 2px solid var(--color-primary);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--color-primary-100);
}

/* Accent: #FEBC4C 노란색 CTA */
.btn--accent {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
.btn--accent:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

/* Ghost */
.btn--ghost {
  background: transparent;
  color: var(--color-primary-deep);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--color-primary-100);
}

/* Outline */
.btn--outline {
  background: transparent;
  color: var(--color-primary-deep);
  border: 2px solid var(--color-primary);
}
.btn--outline:hover:not(:disabled) {
  background: var(--color-primary-50);
}

/* Danger: #FE896A */
.btn--danger {
  background: var(--color-error);
  color: var(--color-on-error);
}
.btn--danger:hover:not(:disabled) {
  background: var(--color-error-deep);
}

.btn--full { width: 100%; }

.btn__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

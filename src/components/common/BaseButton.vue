<template>
  <button :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--full': fullWidth }]" :disabled="disabled || loading" :type="type">
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
  gap: 8px;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }

/* Sizes */
.btn--sm { padding: 8px 16px; font-size: var(--font-size-sm); min-height: var(--touch-min); }
.btn--md { padding: 12px 24px; font-size: var(--font-size-base); min-height: var(--btn-height); }
.btn--lg { padding: 14px 32px; font-size: var(--font-size-lg); min-height: var(--btn-height); }

/* Variants */
.btn--primary { background: var(--gradient-primary); color: var(--color-on-primary); box-shadow: var(--shadow-md); }
.btn--primary:hover:not(:disabled) { box-shadow: var(--shadow-lg); }

.btn--secondary { background: var(--color-secondary); color: var(--color-on-secondary); }
.btn--secondary:hover:not(:disabled) { opacity: 0.9; }

.btn--outline { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn--outline:hover:not(:disabled) { background: rgba(0,97,150,.05); }

.btn--ghost { background: transparent; color: var(--color-primary); }
.btn--ghost:hover:not(:disabled) { background: var(--color-surface-container-low); }

.btn--danger { background: var(--color-error); color: #fff; }
.btn--danger:hover:not(:disabled) { opacity: 0.9; }

.btn--full { width: 100%; }

.btn__spinner {
  width: 20px; height: 20px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

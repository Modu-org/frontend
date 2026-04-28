<template>
  <button
    :class="classes"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
    :type="type"
  >
    <span v-if="loading" class="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
    <slot v-else />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  type: { type: String, default: 'button' },
})

const classes = computed(() => [
  // Base — pill-like 24px radius, 56px min height per design guide
  'inline-flex items-center justify-center gap-2.5 font-bold tracking-tight cursor-pointer select-none',
  'rounded-[24px] transition-all duration-300 ease-out',
  'focus-visible:outline-3 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2',
  'disabled:opacity-40 disabled:cursor-not-allowed',
  'active:scale-[0.96]',
  // Size
  {
    sm: 'px-5 py-2.5 text-[var(--font-size-sm)] min-h-[var(--touch-min)]',
    md: 'px-8 py-3.5 text-[var(--font-size-base)] min-h-[var(--btn-height)]',
    lg: 'px-10 py-4 text-[var(--font-size-lg)] min-h-[var(--btn-height)]',
  }[props.size],
  // Variant
  {
    primary: 'bg-signature-gradient text-[var(--color-on-primary)] sunlight-shadow hover:scale-[1.02] hover:shadow-[var(--shadow-xl)]',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:bg-[var(--color-on-secondary-container)]',
    outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)]/5',
    ghost: 'text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-surface-container-low)]',
    danger: 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90',
  }[props.variant],
  // Full width
  props.fullWidth && 'w-full',
])
</script>

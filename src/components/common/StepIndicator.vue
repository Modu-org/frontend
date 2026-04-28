<template>
  <div class="flex items-center gap-2" role="progressbar" :aria-valuenow="current" :aria-valuemax="total" :aria-label="`${current}/${total} 단계`">
    <template v-for="step in total" :key="step">
      <div
        :class="[
          'h-1.5 flex-1 rounded-full transition-all duration-500 ease-out',
          step < current ? 'bg-[var(--color-primary)]'
            : step === current ? 'bg-signature-gradient shadow-sm'
            : 'bg-[var(--color-surface-container-high)]',
        ]"
      />
    </template>
  </div>
</template>

<script setup>
defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
})
</script>

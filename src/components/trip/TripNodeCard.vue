<template>
  <div class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-DEFAULT)] ghost-border p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-md)]">
    <!-- Drag handle -->
    <div class="flex-shrink-0 cursor-grab active:cursor-grabbing text-[var(--color-outline)] hover:text-[var(--color-on-surface)] handle">
      <span class="material-symbols-outlined">drag_indicator</span>
    </div>

    <!-- Order badge -->
    <div class="flex-shrink-0 w-11 h-11 bg-signature-gradient text-[var(--color-on-primary)] rounded-full flex items-center justify-center text-lg font-extrabold sunlight-shadow">
      {{ node.visitOrder }}
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <h4 class="text-[var(--font-size-base)] font-bold text-[var(--color-on-surface)] tracking-tight truncate">
        {{ node.attraction?.name || '관광지' }}
      </h4>
      <div class="flex items-center gap-3 mt-1.5 flex-wrap">
        <span class="inline-flex items-center gap-1 text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)]">
          <span class="material-symbols-outlined text-sm">schedule</span>
          {{ node.schedule?.stayDurationMinutes || 60 }}분
        </span>
        <span v-if="node.accessibility?.wheelchairAccessible" class="inline-flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-secondary)] font-bold">
          <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">accessible_forward</span>
          가능
        </span>
        <span v-if="node.attraction?.address" class="inline-flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-outline)]">
          <span class="material-symbols-outlined text-sm">location_on</span>
          {{ node.attraction.address?.split(' ').slice(0, 2).join(' ') }}
        </span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex-shrink-0 flex items-center gap-1">
      <button
        class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors text-[var(--color-outline)]"
        aria-label="위로 이동"
        @click="$emit('moveUp')"
      >
        <span class="material-symbols-outlined text-xl">arrow_upward</span>
      </button>
      <button
        class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors text-[var(--color-outline)]"
        aria-label="아래로 이동"
        @click="$emit('moveDown')"
      >
        <span class="material-symbols-outlined text-xl">arrow_downward</span>
      </button>
      <button
        class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-error-container)] transition-colors text-[var(--color-error)]/60 hover:text-[var(--color-error)]"
        aria-label="삭제"
        @click="$emit('remove')"
      >
        <span class="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  node: { type: Object, required: true },
})

defineEmits(['moveUp', 'moveDown', 'remove'])
</script>

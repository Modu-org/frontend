<template>
  <div
    :class="[
      'bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-DEFAULT)] overflow-hidden transition-all duration-300',
      isSelected ? 'border-2 border-[var(--color-primary)] sunlight-shadow' : 'ghost-border hover:shadow-[var(--shadow-lg)] hover:-translate-y-1',
    ]"
    @click="$emit('select', attraction)"
  >
    <!-- Image with overlaid title (editorial style per design guide) -->
    <div class="relative h-52 overflow-hidden">
      <img
        :src="attraction.imageUrl"
        :alt="attraction.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div class="absolute bottom-4 left-5 right-5">
        <h3 class="text-xl font-extrabold text-white tracking-tight leading-tight">{{ attraction.name }}</h3>
        <p class="text-sm text-white/80 font-medium mt-0.5">
          {{ attraction.estimatedCost > 0 ? `${attraction.estimatedCost.toLocaleString()}원` : '무료' }}
        </p>
      </div>
      <!-- Selected checkmark -->
      <div v-if="isSelected" class="absolute top-3 right-3 w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-lg" style="font-variation-settings: 'FILL' 1;">check</span>
      </div>
    </div>

    <div class="p-5">
      <!-- Accessibility Badges -->
      <div class="flex flex-wrap gap-2 mb-3">
        <AccessibilityBadge
          v-for="key in activeBadges"
          :key="key"
          :type="key"
        />
      </div>

      <!-- AI Recommendation reason -->
      <div v-if="attraction.recommendReason" class="bg-[var(--color-surface-container-low)] rounded-[var(--radius-DEFAULT)] p-4 mb-4">
        <p class="text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)] leading-relaxed">
          <span class="font-bold text-[var(--color-primary)]">AI 추천:</span> {{ attraction.recommendReason }}
        </p>
      </div>

      <!-- Action button -->
      <BaseButton
        :variant="isSelected ? 'outline' : 'primary'"
        full-width
        :aria-label="isSelected ? `${attraction.name} 선택 해제` : `${attraction.name} 일정에 추가`"
        @click.stop="$emit(isSelected ? 'unselect' : 'add', attraction)"
      >
        <span class="material-symbols-outlined text-lg">{{ isSelected ? 'check' : 'add' }}</span>
        {{ isSelected ? '추가됨' : '일정에 추가' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AccessibilityBadge from '@/components/common/AccessibilityBadge.vue'

const props = defineProps({
  attraction: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})

defineEmits(['select', 'add', 'unselect'])

const activeBadges = computed(() => {
  const a = props.attraction.accessibility
  if (!a) return []
  return Object.keys(a).filter((k) => a[k] === true)
})
</script>

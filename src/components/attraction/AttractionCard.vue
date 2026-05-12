<template>
  <div :class="['attraction-card', { 'attraction-card--selected': isSelected }]" @click="$emit('select', attraction)">
    <div class="attraction-card__image">
      <img :src="attraction.thumbnailImageUrl" :alt="attraction.name" loading="lazy" />
      <div class="attraction-card__overlay" />
      <div class="attraction-card__info">
        <h3 class="attraction-card__name">{{ attraction.name }}</h3>
      </div>
      <div v-if="isSelected" class="attraction-card__check">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check</span>
      </div>
    </div>

    <div class="attraction-card__body">
      <!-- Accessibility Badges -->
      <div v-if="badgeEntries.length" class="attraction-card__badges">
        <AccessibilityBadge v-for="[key, status] in badgeEntries" :key="key" :type="key" :status="status" />
      </div>

      <p v-if="attraction.overview" class="attraction-card__desc">{{ attraction.overview }}</p>

      <BaseButton :variant="isSelected ? 'outline' : 'primary'" full-width size="sm" @click.stop="$emit(isSelected ? 'unselect' : 'add', attraction)">
        <span class="material-symbols-outlined" style="font-size: 18px;">{{ isSelected ? 'check' : 'add' }}</span>
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

const badgeEntries = computed(() => {
  const summary = props.attraction.accessibilitySummary
  if (!summary) return []
  return Object.entries(summary)
})
</script>

<style scoped>
.attraction-card {
  background: var(--color-surface-container-lowest);
  border-radius: var(--radius-DEFAULT);
  overflow: hidden;
  border: 2px solid rgba(191,199,210,.15);
  transition: all 0.2s ease;
}
.attraction-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.attraction-card--selected { border-color: var(--color-primary); box-shadow: var(--shadow-lg); }

.attraction-card__image { position: relative; height: 200px; overflow: hidden; }
.attraction-card__image img { width: 100%; height: 100%; object-fit: cover; }
.attraction-card__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.5), transparent); }
.attraction-card__info { position: absolute; bottom: 12px; left: 16px; right: 16px; }
.attraction-card__name { font-size: var(--font-size-lg); font-weight: 800; color: #fff; }
.attraction-card__check {
  position: absolute; top: 12px; right: 12px;
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.attraction-card__check .material-symbols-outlined { font-size: 18px; }

.attraction-card__body { padding: 16px; }
.attraction-card__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.attraction-card__desc {
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
</style>

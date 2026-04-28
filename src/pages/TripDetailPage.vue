<template>
  <DefaultLayout :title="tripStore.currentTrip?.title || '일정 상세'" show-back>
    <LoadingSpinner v-if="tripStore.isLoading" />

    <template v-else-if="tripStore.currentTrip">
      <!-- Hero Header (per completed trip detail design: gradient bg) -->
      <section class="relative bg-[var(--color-surface-container-low)] rounded-[var(--radius-lg)] overflow-hidden mb-8 sunlight-shadow">
        <div class="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-fixed)] to-[var(--color-surface-container)] opacity-50" />
        <div class="relative z-10 p-8 md:p-12">
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="inline-flex items-center px-3 py-1.5 bg-[var(--color-surface-container-lowest)]/80 rounded-full text-[var(--font-size-xs)] font-bold text-[var(--color-on-surface)]">
              {{ tripStore.currentTrip.region || '여행' }}
            </span>
            <span class="inline-flex items-center px-3 py-1.5 bg-[var(--color-surface-container-lowest)]/80 rounded-full text-[var(--font-size-xs)] font-bold text-[var(--color-on-surface)]">
              <span class="material-symbols-outlined text-sm mr-1">calendar_today</span>
              {{ tripStore.currentTrip.totalDays || 1 }}일
            </span>
          </div>
          <h1 class="text-[var(--font-size-3xl)] font-extrabold text-[var(--color-on-surface)] tracking-tight leading-tight">
            {{ tripStore.currentTrip.title }}
          </h1>
        </div>
      </section>

      <!-- Barrier-free summary (per design: green box with checks) -->
      <section class="bg-[var(--color-secondary-fixed)]/15 rounded-[var(--radius-DEFAULT)] p-6 mb-8 flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-[var(--color-secondary-fixed-dim)] rounded-full flex items-center justify-center">
          <span class="material-symbols-outlined text-[var(--color-on-secondary-fixed)] text-2xl" style="font-variation-settings: 'FILL' 1;">accessible_forward</span>
        </div>
        <div>
          <h3 class="font-bold text-[var(--color-on-surface)] mb-2">배리어프리 검증 완료</h3>
          <div class="flex flex-col gap-1.5">
            <span class="inline-flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)]">
              <span class="material-symbols-outlined text-[var(--color-secondary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              전 구간 휠체어 접근 가능
            </span>
            <span class="inline-flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)]">
              <span class="material-symbols-outlined text-[var(--color-secondary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              장애인 화장실 전 장소 구비
            </span>
            <span class="inline-flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)]">
              <span class="material-symbols-outlined text-[var(--color-secondary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              엘리베이터 또는 경사로 완비
            </span>
          </div>
        </div>
      </section>

      <!-- Stats Grid (per design: 4-column summary) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div class="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[var(--radius-DEFAULT)] p-5 text-center">
          <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-2">location_on</span>
          <p class="text-[var(--font-size-2xl)] font-extrabold text-[var(--color-on-surface)]">{{ tripStore.sortedNodes.length }}</p>
          <p class="text-[var(--font-size-xs)] text-[var(--color-outline)] font-medium">방문 장소</p>
        </div>
        <div class="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[var(--radius-DEFAULT)] p-5 text-center">
          <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-2">schedule</span>
          <p class="text-[var(--font-size-2xl)] font-extrabold text-[var(--color-on-surface)]">{{ Math.floor(tripStore.totalDurationMinutes / 60) }}<span class="text-[var(--font-size-lg)]">시간</span></p>
          <p class="text-[var(--font-size-xs)] text-[var(--color-outline)] font-medium">예상 소요</p>
        </div>
        <div class="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[var(--radius-DEFAULT)] p-5 text-center">
          <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-2">payments</span>
          <p class="text-[var(--font-size-2xl)] font-extrabold text-[var(--color-on-surface)]">{{ (tripStore.totalEstimatedCost / 10000).toFixed(1) }}<span class="text-[var(--font-size-lg)]">만원~</span></p>
          <p class="text-[var(--font-size-xs)] text-[var(--color-outline)] font-medium">1인당 경비</p>
        </div>
        <div class="bg-[var(--color-secondary-fixed)] rounded-[var(--radius-DEFAULT)] p-5 text-center">
          <span class="material-symbols-outlined text-[var(--color-on-secondary-fixed)] text-2xl mb-2">verified</span>
          <p class="text-[var(--font-size-lg)] font-extrabold text-[var(--color-on-secondary-fixed)]">전체<br/>배리어프리</p>
        </div>
      </div>

      <!-- Map -->
      <div class="mb-10 rounded-[var(--radius-lg)] overflow-hidden ghost-border">
        <KakaoMap :markers="mapMarkers" height="300px" />
      </div>

      <!-- Timeline (per design: numbered circles with left border) -->
      <h3 class="text-[var(--font-size-lg)] font-bold text-[var(--color-on-surface)] mb-6 pl-3 border-l-4 border-[var(--color-primary)]">
        Trip Itinerary
      </h3>

      <div class="relative pl-10 mb-10">
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--color-primary-fixed)]" />
        <div v-for="(node, idx) in tripStore.sortedNodes" :key="node.nodeId" class="relative mb-8 last:mb-0">
          <!-- Circle number -->
          <div class="absolute -left-6 top-0 w-8 h-8 bg-signature-gradient text-[var(--color-on-primary)] rounded-full flex items-center justify-center text-[13px] font-extrabold sunlight-shadow z-10">
            {{ node.visitOrder }}
          </div>

          <BaseCard elevated>
            <h4 class="text-[var(--font-size-lg)] font-bold text-[var(--color-on-surface)] tracking-tight">
              {{ node.attraction?.name }}
            </h4>
            <p class="inline-flex items-center gap-1.5 text-[var(--font-size-sm)] text-[var(--color-on-surface-variant)] mt-2">
              <span class="material-symbols-outlined text-sm">schedule</span>
              {{ node.schedule?.stayDurationMinutes || 60 }}분
              <template v-if="node.estimatedCost">
                <span class="mx-1">·</span>
                <span class="material-symbols-outlined text-sm">payments</span>
                {{ node.estimatedCost > 0 ? `${node.estimatedCost.toLocaleString()}원` : '무료' }}
              </template>
            </p>
            <!-- Accessibility badges -->
            <div v-if="node.accessibility" class="flex flex-wrap gap-2 mt-3">
              <AccessibilityBadge
                v-for="key in Object.keys(node.accessibility).filter(k => node.accessibility[k] === true)"
                :key="key"
                :type="key"
              />
            </div>
          </BaseCard>

          <!-- Travel time between nodes -->
          <div v-if="idx < tripStore.sortedNodes.length - 1" class="flex items-center gap-2 mt-4 ml-2 text-[var(--font-size-xs)] text-[var(--color-outline)]">
            <span class="material-symbols-outlined text-sm">directions_car</span>
            차로 약 25분 이동
          </div>
        </div>
      </div>

      <!-- Action buttons (per design: 수정하기 + 공유하기) -->
      <div class="flex gap-3 mb-8">
        <BaseButton variant="outline" full-width @click="$router.push(`/trip/${route.params.tripId}/edit`)">
          <span class="material-symbols-outlined text-lg">edit</span>
          수정하기
        </BaseButton>
        <BaseButton full-width>
          <span class="material-symbols-outlined text-lg">share</span>
          공유하기
        </BaseButton>
      </div>
    </template>
  </DefaultLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AccessibilityBadge from '@/components/common/AccessibilityBadge.vue'
import KakaoMap from '@/components/map/KakaoMap.vue'
import { useTripStore } from '@/stores/tripStore'

const route = useRoute()
const tripStore = useTripStore()

onMounted(async () => {
  if (route.params.tripId) await tripStore.fetchTripDetail(route.params.tripId)
})

const mapMarkers = computed(() =>
  tripStore.sortedNodes
    .filter((n) => n.attraction?.latitude)
    .map((n) => ({ lat: n.attraction.latitude, lng: n.attraction.longitude, title: n.attraction.name }))
)
</script>

<template>
  <div class="min-h-screen bg-[var(--color-surface)]">
    <!-- Top bar (per node editor web design) -->
    <header class="sticky top-0 z-50 bg-glass px-4 sm:px-6 lg:px-8">
      <div class="max-w-[var(--content-max-width)] mx-auto flex items-center justify-between h-[var(--header-height)]">
        <div class="flex items-center gap-3">
          <button class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors" aria-label="제목 편집">
            <span class="material-symbols-outlined text-[var(--color-primary)]">edit</span>
          </button>
          <h1 class="text-xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            {{ tripStore.currentTrip?.title || '일정 편집' }}
          </h1>
        </div>
        <!-- Summary stats (per design: icon + value inline) -->
        <div class="hidden md:flex items-center gap-6 text-[var(--font-size-sm)]">
          <span class="inline-flex items-center gap-1.5 text-[var(--color-on-surface-variant)]">
            <span class="material-symbols-outlined text-lg text-[var(--color-primary)]">payments</span>
            총 ₩{{ tripStore.totalEstimatedCost.toLocaleString() }}
          </span>
          <span class="inline-flex items-center gap-1.5 text-[var(--color-on-surface-variant)]">
            <span class="material-symbols-outlined text-lg text-[var(--color-primary)]">schedule</span>
            총 {{ Math.floor(tripStore.totalDurationMinutes / 60) }}시간
          </span>
          <span class="inline-flex items-center gap-1.5 text-[var(--color-on-surface-variant)]">
            <span class="material-symbols-outlined text-lg text-[var(--color-primary)]">group</span>
            2명
          </span>
        </div>
        <div class="flex items-center gap-3">
          <button class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors" aria-label="공유">
            <span class="material-symbols-outlined text-[var(--color-on-surface-variant)]">share</span>
          </button>
          <BaseButton size="sm" @click="handleSave">
            <span class="material-symbols-outlined text-lg">save</span>
            저장하기
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Main: split layout (per design: node list left, map right on web) -->
    <div class="max-w-[var(--content-max-width)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
        <!-- Left: Node list -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-[var(--font-size-base)] font-bold text-[var(--color-on-surface-variant)] pl-3 border-l-4 border-[var(--color-primary)]">
              여행 경로 일정
            </h2>
            <div class="inline-flex items-center gap-1.5 bg-[var(--color-secondary-fixed-dim)]/20 text-[var(--color-secondary)] px-3 py-1.5 rounded-full text-xs font-bold">
              <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">accessible_forward</span>
              Barrier-Free
            </div>
          </div>

          <LoadingSpinner v-if="tripStore.isLoading" />

          <draggable
            v-else
            v-model="nodeList"
            item-key="nodeId"
            handle=".handle"
            animation="250"
            class="flex flex-col gap-4"
            @end="handleReorder"
          >
            <template #item="{ element }">
              <TripNodeCard
                :node="element"
                @move-up="moveNode(element, -1)"
                @move-down="moveNode(element, 1)"
                @remove="handleRemove(element.nodeId)"
              />
            </template>
          </draggable>

          <!-- Drop zone (per design: dashed add area) -->
          <button
            class="w-full mt-4 py-6 border-2 border-dashed border-[var(--color-outline-variant)]/30 rounded-[var(--radius-DEFAULT)] text-[var(--color-primary)] flex items-center justify-center gap-2 font-bold hover:bg-[var(--color-surface-container-low)] transition-colors"
            @click="$router.push('/attractions')"
          >
            <span class="material-symbols-outlined">add</span>
            여행지 추가하기
          </button>
        </div>

        <!-- Right: Map (hidden on mobile, shown on desktop per design) -->
        <div class="hidden lg:block sticky top-[calc(var(--header-height)+var(--space-lg))] h-[calc(100vh-var(--header-height)-48px)] rounded-[var(--radius-lg)] overflow-hidden">
          <KakaoMap :markers="mapMarkers" height="100%" />
        </div>
      </div>
    </div>

    <!-- Mobile bottom CTA -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 p-5 bg-glass z-20">
      <BaseButton full-width size="lg" @click="handleSave">
        일정 저장하기
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TripNodeCard from '@/components/trip/TripNodeCard.vue'
import KakaoMap from '@/components/map/KakaoMap.vue'
import { useTripStore } from '@/stores/tripStore'

const route = useRoute()
const router = useRouter()
const tripStore = useTripStore()
const nodeList = ref([])

onMounted(async () => {
  if (route.params.tripId) await tripStore.fetchTripDetail(route.params.tripId)
})

watch(() => tripStore.sortedNodes, (nodes) => {
  nodeList.value = [...nodes]
}, { immediate: true, deep: true })

const mapMarkers = computed(() =>
  tripStore.sortedNodes
    .filter((n) => n.attraction?.latitude)
    .map((n) => ({ lat: n.attraction.latitude, lng: n.attraction.longitude, title: n.attraction.name }))
)

async function handleReorder() {
  await tripStore.reorderNodes(nodeList.value.map((n) => n.nodeId))
}

function moveNode(node, direction) {
  const list = [...nodeList.value]
  const idx = list.findIndex((n) => n.nodeId === node.nodeId)
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= list.length) return
  ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
  nodeList.value = list
  handleReorder()
}

async function handleRemove(nodeId) { await tripStore.removeNode(nodeId) }

function handleSave() { router.push(`/trip/${route.params.tripId}`) }
</script>

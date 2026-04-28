<template>
  <DefaultLayout :title="attraction?.name || '관광지 상세'" show-back>
    <div v-if="!attraction" class="py-20 text-center">
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- Hero Image -->
      <div class="relative h-64 md:h-[400px] rounded-[var(--radius-lg)] overflow-hidden -mx-[var(--space-md)] md:mx-0 -mt-6 md:mt-0 mb-8">
        <img :src="attraction.imageUrl" :alt="attraction.name" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div class="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div>
            <span class="inline-block bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-full mb-2">{{ attraction.category }}</span>
            <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{{ attraction.name }}</h1>
            <p class="text-white/80 text-sm mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">location_on</span>
              {{ attraction.address }}
            </p>
          </div>
          <button
            @click="toggleFavorite"
            class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90"
            :class="isFavorite ? 'text-red-400' : 'text-white'"
            :aria-label="isFavorite ? '찜 해제' : '찜하기'"
          >
            <span class="material-symbols-outlined text-2xl" :style="{ fontVariationSettings: isFavorite ? `'FILL' 1` : `'FILL' 0` }">favorite</span>
          </button>
        </div>
      </div>

      <!-- Two-column layout on desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <!-- Left: Main info (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-[var(--color-surface-container-lowest)] p-4 rounded-[var(--radius-DEFAULT)] ghost-border text-center">
              <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-1">schedule</span>
              <p class="text-sm font-bold">체류시간</p>
              <p class="text-xs text-[var(--color-on-surface-variant)]">{{ attraction.estimatedDuration || 60 }}분</p>
            </div>
            <div class="bg-[var(--color-surface-container-lowest)] p-4 rounded-[var(--radius-DEFAULT)] ghost-border text-center">
              <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-1">payments</span>
              <p class="text-sm font-bold">비용</p>
              <p class="text-xs text-[var(--color-on-surface-variant)]">{{ attraction.estimatedCost > 0 ? `${attraction.estimatedCost.toLocaleString()}원` : '무료' }}</p>
            </div>
            <div class="bg-[var(--color-surface-container-lowest)] p-4 rounded-[var(--radius-DEFAULT)] ghost-border text-center">
              <span class="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-1">call</span>
              <p class="text-sm font-bold">전화</p>
              <p class="text-xs text-[var(--color-on-surface-variant)]">{{ attraction.phone || '정보 없음' }}</p>
            </div>
            <div class="bg-[var(--color-surface-container-lowest)] p-4 rounded-[var(--radius-DEFAULT)] ghost-border text-center">
              <span class="material-symbols-outlined text-[var(--color-secondary)] text-2xl mb-1">accessible_forward</span>
              <p class="text-sm font-bold">접근성</p>
              <div class="flex gap-1 mt-1 flex-wrap justify-center">
                <AccessibilityBadge v-for="key in activeBadges" :key="key" :type="key" />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border">
            <h2 class="text-lg font-bold mb-3">상세 정보</h2>
            <p class="text-[var(--color-on-surface-variant)] leading-relaxed text-sm">
              {{ attraction.recommendReason || '이 관광지에 대한 상세 설명이 아직 준비되지 않았습니다.' }}
            </p>
            <p v-if="attraction.accessibility?.accessibilityNote" class="mt-4 p-4 bg-[var(--color-surface-container-low)] rounded-[var(--radius-DEFAULT)] text-sm text-[var(--color-on-surface-variant)]">
              <span class="font-bold text-[var(--color-secondary)]">♿ 접근성 참고:</span> {{ attraction.accessibility.accessibilityNote }}
            </p>
          </div>

          <!-- 소통 / 제보 섹션 -->
          <div class="bg-[var(--color-surface-container-low)] p-6 rounded-[var(--radius-lg)] ghost-border">
            <h2 class="text-lg font-bold mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--color-primary)]">forum</span>
              소통 및 제보
            </h2>
            <p class="text-sm text-[var(--color-on-surface-variant)] mb-5">
              여행지의 불편사항을 제보하거나, 다른 분들에게 이 장소를 추천하는 글을 작성해보세요.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BaseButton variant="outline" @click="handleWriteBoard('제보')">
                <span class="material-symbols-outlined text-sm">report_problem</span>
                불편사항 제보하기
              </BaseButton>
              <BaseButton variant="primary" @click="handleWriteBoard('추천')">
                <span class="material-symbols-outlined text-sm">edit_square</span>
                게시판 글 작성하기
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Right sidebar (desktop) -->
        <div class="space-y-6">
          <!-- 찜하기 카드 -->
          <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border text-center">
            <h3 class="text-lg font-bold mb-2">이 곳이 마음에 드셨나요?</h3>
            <p class="text-sm text-[var(--color-on-surface-variant)] mb-4">찜 목록에 추가하고 나중에 다시 방문하세요.</p>
            <BaseButton :variant="isFavorite ? 'outline' : 'primary'" full-width @click="toggleFavorite">
              <span class="material-symbols-outlined" :style="{ fontVariationSettings: isFavorite ? `'FILL' 1` : `'FILL' 0` }">favorite</span>
              {{ isFavorite ? '찜 완료' : '찜하기' }}
            </BaseButton>
          </div>

          <!-- 여행 계획 추가 -->
          <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border">
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--color-primary)]">calendar_month</span>
              여행 계획에 추가
            </h3>
            <p class="text-sm text-[var(--color-on-surface-variant)] mb-4">이 관광지를 나의 여행 일정에 포함시켜보세요.</p>
            <BaseButton full-width size="lg" @click="handleAddTrip">
              <span class="material-symbols-outlined">add_task</span>
              여행 계획에 추가
            </BaseButton>
          </div>

          <!-- 공유 -->
          <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border">
            <h3 class="text-lg font-bold mb-3">공유하기</h3>
            <div class="flex gap-2">
              <BaseButton variant="ghost" class="flex-1" @click="copyLink">
                <span class="material-symbols-outlined text-sm">content_copy</span>
                링크 복사
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AccessibilityBadge from '@/components/common/AccessibilityBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_ATTRACTIONS } from '@/api/mock/mockData'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const attraction = ref(null)
const isFavorite = ref(false)

onMounted(() => {
  const id = route.params.id
  attraction.value = MOCK_ATTRACTIONS.find(
    item => item.attractionId === String(id) || item.attractionId === id
  ) || MOCK_ATTRACTIONS[0]
})

const activeBadges = computed(() => {
  if (!attraction.value?.accessibility) return []
  const a = attraction.value.accessibility
  return Object.keys(a).filter((k) => a[k] === true && k !== 'accessibilityNote')
})

function requireAuth() {
  if (!authStore.isAuthenticated) {
    if (confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
      router.push({ name: 'Login', query: { redirect: route.fullPath } })
    }
    return false
  }
  return true
}

function toggleFavorite() {
  if (!requireAuth()) return
  isFavorite.value = !isFavorite.value
}

function handleAddTrip() {
  if (!requireAuth()) return
  alert('일정에 추가했습니다. (MVP - 백엔드 연동 후 동작)')
}

function handleWriteBoard(type) {
  if (!requireAuth()) return
  router.push({ name: 'BoardWrite', query: { attractionId: attraction.value.attractionId, type } })
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  alert('링크가 복사되었습니다.')
}
</script>

<template>
  <DefaultLayout title="내 여행">
    <!-- 새 여행 계획 추가 -->
    <div class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] ghost-border p-5 mb-8">
      <h2 class="text-lg font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
        <span class="material-symbols-outlined text-[var(--color-primary)]">add_circle</span>
        새 여행 계획
      </h2>
      <div class="flex gap-3">
        <BaseInput v-model="newTripName" placeholder="여행 계획 이름 (예: 제주 2박3일)" class="flex-1" @keyup.enter="createNewTrip" />
        <BaseButton @click="createNewTrip" :disabled="!newTripName.trim()" class="flex-shrink-0">
          만들기
        </BaseButton>
      </div>
    </div>

    <!-- 여행 일정 목록 -->
    <div class="mb-8">
      <div class="flex items-end justify-between mb-4">
        <h2 class="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
          <span class="material-symbols-outlined text-[var(--color-primary)]">calendar_month</span>
          내 여행 일정
          <span class="text-sm font-normal text-[var(--color-outline)]">({{ tripStore.trips.length }})</span>
        </h2>
      </div>

      <LoadingSpinner v-if="tripStore.isLoading" />

      <div v-else-if="tripStore.trips.length" class="flex flex-col gap-4">
        <div
          v-for="trip in tripStore.trips"
          :key="trip.tripId"
          class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] ghost-border p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0" @click="goToTrip(trip)">
              <h3 class="text-base font-bold text-[var(--color-on-surface)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                {{ trip.title }}
              </h3>
              <p class="text-sm text-[var(--color-outline)] mt-1">
                {{ trip.region || '지역 미정' }} · {{ trip.totalDays || 1 }}일
              </p>
              <p class="text-xs text-[var(--color-outline-variant)] mt-1">
                {{ formatDate(trip.createdAt) }}
              </p>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button
                class="p-2 rounded-full hover:bg-[var(--color-surface-container)] transition-colors"
                @click.stop="editTrip(trip)"
                aria-label="수정"
              >
                <span class="material-symbols-outlined text-lg text-[var(--color-outline)]">edit</span>
              </button>
              <button
                class="p-2 rounded-full hover:bg-red-50 transition-colors"
                @click.stop="deleteTrip(trip)"
                aria-label="삭제"
              >
                <span class="material-symbols-outlined text-lg text-red-400">delete</span>
              </button>
            </div>
          </div>
          <!-- Node count summary -->
          <div class="mt-3 pt-3 border-t border-[var(--color-outline-variant)]/10 flex items-center gap-4 text-xs text-[var(--color-outline)]">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">location_on</span>
              {{ trip.nodeCount || 0 }}개 장소
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">schedule</span>
              {{ trip.status === 'DRAFT' ? '작성 중' : '완료' }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <span class="material-symbols-outlined text-6xl text-[var(--color-outline-variant)] mb-4">luggage</span>
        <p class="text-[var(--color-outline)] text-base mb-2">아직 만든 여행이 없습니다.</p>
        <p class="text-[var(--color-outline-variant)] text-sm">위에서 새 여행 계획을 만들어보세요!</p>
      </div>
    </div>

    <!-- 찜한 관광지 -->
    <div class="mb-8">
      <h2 class="text-lg font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-red-400" style="font-variation-settings: 'FILL' 1;">favorite</span>
        찜한 관광지
      </h2>
      <p class="text-center text-[var(--color-outline)] py-8 text-sm">찜한 관광지가 없습니다.</p>
    </div>

    <!-- Edit Trip Modal -->
    <div v-if="editingTrip" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="editingTrip = null">
      <div class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-bold mb-4">여행 일정 수정</h3>
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">이름</label>
            <BaseInput v-model="editForm.title" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">지역</label>
            <BaseInput v-model="editForm.region" placeholder="예: 서울, 제주" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">일수</label>
            <BaseInput v-model.number="editForm.totalDays" type="number" min="1" />
          </div>
        </div>
        <div class="flex gap-3">
          <BaseButton variant="ghost" class="flex-1" @click="editingTrip = null">취소</BaseButton>
          <BaseButton class="flex-1" @click="saveEdit">저장</BaseButton>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useTripStore } from '@/stores/tripStore'

const router = useRouter()
const tripStore = useTripStore()

const newTripName = ref('')
const editingTrip = ref(null)
const editForm = reactive({ title: '', region: '', totalDays: 1 })

onMounted(() => {
  tripStore.fetchTrips()
})

async function createNewTrip() {
  if (!newTripName.value.trim()) return
  const trip = await tripStore.createTrip({
    title: newTripName.value.trim(),
    region: '',
    totalDays: 1,
  })
  newTripName.value = ''
  router.push(`/trip/${trip.tripId}/edit`)
}

function goToTrip(trip) {
  router.push(`/trip/${trip.tripId}`)
}

function editTrip(trip) {
  editingTrip.value = trip
  editForm.title = trip.title
  editForm.region = trip.region || ''
  editForm.totalDays = trip.totalDays || 1
}

async function saveEdit() {
  if (!editingTrip.value) return
  await tripStore.updateTrip(editingTrip.value.tripId, {
    title: editForm.title,
    region: editForm.region,
    totalDays: editForm.totalDays,
  })
  editingTrip.value = null
}

async function deleteTrip(trip) {
  if (!confirm(`"${trip.title}" 여행 계획을 삭제하시겠습니까?`)) return
  await tripStore.deleteTrip(trip.tripId)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <DefaultLayout title="관광지 탐색">
    <!-- Search & Filters -->
    <div class="mb-6">
      <div class="flex gap-3 mb-4">
        <BaseInput v-model="keyword" placeholder="키워드 검색..." class="flex-1" @keyup.enter="handleSearch" />
        <button class="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all flex-shrink-0" @click="handleSearch">
          검색
        </button>
      </div>
      <!-- Category Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.value"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all',
            selectedCategory === cat.value
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-container)]'
          ]"
          @click="selectedCategory = selectedCategory === cat.value ? '' : cat.value"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Tab switcher: 목록 보기 / 지도에서 보기 -->
    <div class="flex bg-[var(--color-surface-container-low)] rounded-[24px] p-1.5 mb-6">
      <button
        v-for="tab in [{ key: 'list', label: '목록 보기' }, { key: 'map', label: '지도에서 보기' }]"
        :key="tab.key"
        :class="[
          'flex-1 py-3 rounded-[20px] text-sm font-bold tracking-tight transition-all duration-300',
          activeTab === tab.key
            ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] sunlight-shadow'
            : 'text-[var(--color-outline)]'
        ]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- List View -->
    <div v-if="activeTab === 'list'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <AttractionCard
        v-for="a in filteredAttractions"
        :key="a.attractionId"
        :attraction="a"
        @select="goToDetail"
        @add="handleAddToTrip"
      />
      <p v-if="!filteredAttractions.length" class="col-span-full text-center text-[var(--color-outline)] py-12">
        조건에 맞는 관광지가 없습니다.
      </p>
    </div>

    <!-- Map View with Sidebar -->
    <div v-else class="flex gap-0 md:gap-6 flex-col md:flex-row" style="min-height: 70vh;">
      <!-- Map -->
      <div class="flex-1 relative rounded-[var(--radius-lg)] overflow-hidden" style="min-height: 400px;">
        <div ref="mapEl" class="w-full h-full" style="min-height: 400px;" />
        <!-- 내 위치 버튼 -->
        <button
          class="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-[var(--color-surface-container)] transition-colors"
          @click="goToMyLocation"
          aria-label="내 위치로 이동"
        >
          <span class="material-symbols-outlined text-[var(--color-primary)]">my_location</span>
        </button>
      </div>

      <!-- Sidebar: 선택된 관광지 정보 -->
      <div class="w-full md:w-80 flex-shrink-0 mt-4 md:mt-0">
        <div v-if="selectedMapAttraction" class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] ghost-border overflow-hidden">
          <img :src="selectedMapAttraction.imageUrl" :alt="selectedMapAttraction.name" class="w-full h-40 object-cover" />
          <div class="p-5 space-y-3">
            <h3 class="text-lg font-extrabold text-[var(--color-on-surface)]">{{ selectedMapAttraction.name }}</h3>
            <p class="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">location_on</span>
              {{ selectedMapAttraction.address }}
            </p>
            <p class="text-xs text-[var(--color-on-surface-variant)]">
              {{ selectedMapAttraction.estimatedCost > 0 ? `${selectedMapAttraction.estimatedCost.toLocaleString()}원` : '무료' }}
            </p>
            <p v-if="selectedMapAttraction.recommendReason" class="text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/5 rounded-lg p-3">
              {{ selectedMapAttraction.recommendReason }}
            </p>
            <div class="flex gap-2 pt-2">
              <BaseButton size="sm" class="flex-1" @click="goToDetail(selectedMapAttraction)">상세보기</BaseButton>
              <BaseButton size="sm" variant="outline" class="flex-1" @click="handleAddToTrip(selectedMapAttraction)">일정 추가</BaseButton>
            </div>
          </div>
        </div>
        <div v-else class="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] ghost-border p-8 text-center">
          <span class="material-symbols-outlined text-5xl text-[var(--color-outline-variant)] mb-3">touch_app</span>
          <p class="text-sm text-[var(--color-outline)]">지도의 마커를 클릭하면<br/>관광지 정보가 표시됩니다.</p>
        </div>

        <!-- 주변 관광지 리스트 -->
        <h4 class="text-sm font-bold text-[var(--color-on-surface-variant)] mt-5 mb-3">주변 관광지</h4>
        <div class="space-y-2 max-h-[300px] overflow-y-auto">
          <button
            v-for="a in filteredAttractions"
            :key="a.attractionId"
            class="w-full text-left bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-DEFAULT)] ghost-border p-3 hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-3"
            @click="selectMapAttraction(a)"
          >
            <img :src="a.imageUrl" :alt="a.name" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--color-on-surface)] truncate">{{ a.name }}</p>
              <p class="text-xs text-[var(--color-outline)] truncate">{{ a.address }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AttractionCard from '@/components/attraction/AttractionCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_ATTRACTIONS } from '@/api/mock/mockData'
import { useKakaoMap } from '@/composables/useKakaoMap'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const CATEGORIES = [
  { value: '관광지', label: '관광지' },
  { value: '문화시설', label: '문화시설' },
  { value: '자연관광지', label: '자연관광지' },
  { value: '문화/역사', label: '문화/역사' },
  { value: '박물관/미술관', label: '박물관/미술관' },
]

const activeTab = ref('list')
const keyword = ref(route.query.keyword || '')
const selectedCategory = ref('')
const selectedMapAttraction = ref(null)
const myLocation = ref(null)

const mapEl = ref(null)
const { initMap, addMarker, clearMarkers } = useKakaoMap()

const filteredAttractions = computed(() => {
  let result = [...MOCK_ATTRACTIONS]
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(kw) || a.address.toLowerCase().includes(kw))
  }
  if (selectedCategory.value) {
    result = result.filter(a => a.category === selectedCategory.value)
  }
  return result
})

function handleSearch() {
  // Just filtering reactively via computed
}

function goToDetail(attraction) {
  router.push(`/attraction/${attraction.attractionId}`)
}

function handleAddToTrip(attraction) {
  if (!authStore.isAuthenticated) {
    if (confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
      router.push({ name: 'Login', query: { redirect: route.fullPath } })
    }
    return
  }
  alert(`${attraction.name}을(를) 일정에 추가했습니다. (MVP)`)
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'map') {
    nextTick(() => initMapView())
  }
}

function selectMapAttraction(a) {
  selectedMapAttraction.value = a
}

async function initMapView() {
  if (!mapEl.value) return

  // 내 위치 가져오기
  const center = await getMyLocation()

  await initMap(mapEl.value, {
    lat: center.lat,
    lng: center.lng,
    level: 7,
  })

  renderMapMarkers()
}

function renderMapMarkers() {
  clearMarkers()
  filteredAttractions.value.forEach(a => {
    addMarker(a.latitude, a.longitude, {
      title: a.name,
      onClick: () => { selectedMapAttraction.value = a },
    })
  })
}

function getMyLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 37.5665, lng: 126.978 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        myLocation.value = loc
        resolve(loc)
      },
      () => resolve({ lat: 37.5665, lng: 126.978 }),
      { timeout: 5000 }
    )
  })
}

async function goToMyLocation() {
  const loc = await getMyLocation()
  if (mapEl.value) {
    await initMap(mapEl.value, { lat: loc.lat, lng: loc.lng, level: 5 })
    renderMapMarkers()
  }
}

onMounted(() => {
  if (route.query.keyword) keyword.value = route.query.keyword
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>

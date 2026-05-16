<template>
  <DefaultLayout title="관광지 탐색">
    <!-- Search & Filters -->
    <div class="search-bar">
      <BaseInput v-model="keyword" placeholder="키워드 검색..." @keyup.enter="handleSearch" />
      <BaseButton @click="handleSearch">검색</BaseButton>
    </div>

    <div class="category-filters">
      <button
        v-for="ct in CONTENT_TYPES"
        :key="ct.id"
        :class="['filter-chip', { 'filter-chip--active': selectedType === ct.id }]"
        @click="selectedType = selectedType === ct.id ? '' : ct.id"
      >
        {{ ct.label }}
      </button>
    </div>

    <!-- Tab: 목록 / 지도 -->
    <div class="view-tabs">
      <button v-for="tab in viewTabs" :key="tab.key" :class="['view-tab', { 'view-tab--active': activeTab === tab.key }]" @click="switchTab(tab.key)">
        {{ tab.label }}
      </button>
    </div>

    <!-- List View -->
    <div v-if="activeTab === 'list'" class="attraction-grid">
      <AttractionCard v-for="a in filteredAttractions" :key="a.attractionId" :attraction="a" @select="goToDetail" @add="handleAddToSchedule" />
      <p v-if="!filteredAttractions.length" class="empty-msg">조건에 맞는 관광지가 없습니다.</p>
    </div>

    <!-- Map View -->
    <div v-else class="map-layout">
      <div class="map-container">
        <div ref="mapEl" class="map-el" />
        <button class="map-location-btn" @click="goToMyLocation" aria-label="내 위치로 이동">
          <span class="material-symbols-outlined">my_location</span>
        </button>
      </div>

      <aside class="map-sidebar">
        <!-- Selected attraction info -->
        <BaseCard v-if="selectedAttraction" padding="sm">
          <img :src="selectedAttraction.firstImageUrl || selectedAttraction.thumbnailImageUrl" :alt="selectedAttraction.name" class="sidebar-img" />
          <div class="sidebar-detail">
            <h3 class="sidebar-name">{{ selectedAttraction.name }}</h3>
            <p class="sidebar-address">
              <span class="material-symbols-outlined" style="font-size:14px;">location_on</span>
              {{ selectedAttraction.address }}
            </p>
            <div class="sidebar-actions">
              <BaseButton size="sm" @click="goToDetail(selectedAttraction)">상세보기</BaseButton>
              <BaseButton size="sm" variant="outline" @click="handleAddToSchedule(selectedAttraction)">일정 추가</BaseButton>
            </div>
          </div>
        </BaseCard>
        <div v-else class="sidebar-placeholder">
          <span class="material-symbols-outlined" style="font-size:40px;">touch_app</span>
          <p>마커를 클릭하면 정보가 표시됩니다.</p>
        </div>

        <h4 class="sidebar-section-title">주변 관광지</h4>
        <div class="sidebar-list">
          <BaseListItem v-for="a in filteredAttractions" :key="a.attractionId" clickable @click="selectAttraction(a)">
            <template #leading>
              <img :src="a.thumbnailImageUrl" :alt="a.name" class="sidebar-thumb" />
            </template>
            {{ a.name }}
            <template #subtitle>{{ a.address }}</template>
          </BaseListItem>
        </div>
      </aside>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseListItem from '@/components/common/BaseListItem.vue'
import AttractionCard from '@/components/attraction/AttractionCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_ATTRACTIONS } from '@/api/mock/mockData'
import { CONTENT_TYPES } from '@/constants/enums'
import { useKakaoMap } from '@/composables/useKakaoMap'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('list')
const keyword = ref(route.query.keyword || '')
const selectedType = ref('')
const selectedAttraction = ref(null)
const mapEl = ref(null)
const { initMap, addMarker, clearMarkers } = useKakaoMap()

const viewTabs = [
  { key: 'list', label: '목록 보기' },
  { key: 'map', label: '지도에서 보기' },
]

const filteredAttractions = computed(() => {
  let result = [...MOCK_ATTRACTIONS]
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    result = result.filter((a) => a.name.toLowerCase().includes(kw) || a.address.toLowerCase().includes(kw))
  }
  if (selectedType.value) {
    result = result.filter((a) => a.contentTypeId === selectedType.value)
  }
  return result
})

function handleSearch() { /* reactive filtering via computed */ }

function goToDetail(a) { router.push(`/attraction/${a.attractionId}`) }

function handleAddToSchedule(a) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  // TODO: open schedule picker
  alert(`${a.name}을(를) 일정에 추가합니다.`)
}

function selectAttraction(a) { selectedAttraction.value = a }

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'map') nextTick(() => initMapView())
}

async function initMapView() {
  if (!mapEl.value) return
  const center = await getMyLocation()
  await initMap(mapEl.value, { lat: center.lat, lng: center.lng, level: 7 })
  renderMarkers()
}

function renderMarkers() {
  clearMarkers()
  filteredAttractions.value.forEach((a) => {
    addMarker(a.latitude, a.longitude, { title: a.name, onClick: () => { selectedAttraction.value = a } })
  })
}

function getMyLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ lat: 37.5665, lng: 126.978 }); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 37.5665, lng: 126.978 }),
      { timeout: 5000 }
    )
  })
}

async function goToMyLocation() {
  const loc = await getMyLocation()
  if (mapEl.value) { await initMap(mapEl.value, { lat: loc.lat, lng: loc.lng, level: 5 }); renderMarkers() }
}

onMounted(() => { if (route.query.keyword) keyword.value = route.query.keyword })
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.search-bar .input-group { flex: 1; }

.category-filters { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 16px; }
.category-filters::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0; padding: 8px 16px; border-radius: var(--radius-full);
  font-size: var(--font-size-xs); font-weight: 700; border: none; cursor: pointer;
  background: var(--color-surface-container-lowest); color: var(--color-on-surface-variant);
  border: 2px solid rgba(191,199,210,.15); transition: all 0.15s;
}
.filter-chip--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.view-tabs {
  display: flex; background: var(--color-surface-container-low);
  border-radius: var(--radius-md); padding: 4px; margin-bottom: 20px;
}
.view-tab {
  flex: 1; padding: 10px; border-radius: 20px; font-size: var(--font-size-sm); font-weight: 700;
  border: none; cursor: pointer; background: none; color: var(--color-outline); transition: all 0.2s;
}
.view-tab--active { background: var(--color-surface-container-lowest); color: var(--color-primary); box-shadow: var(--shadow-md); }

.attraction-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.empty-msg { grid-column: 1 / -1; text-align: center; color: var(--color-outline); padding: 48px 0; }

.map-layout { display: flex; flex-direction: column; gap: 16px; min-height: 70vh; }
@media (min-width: 768px) { .map-layout { flex-direction: row; } }

.map-container { flex: 1; position: relative; border-radius: var(--radius-lg); overflow: hidden; min-height: 400px; }
.map-el { width: 100%; height: 100%; min-height: 400px; }
.map-location-btn {
  position: absolute; bottom: 16px; right: 16px; width: 48px; height: 48px;
  border-radius: 50%; background: #fff; border: none; cursor: pointer;
  box-shadow: var(--shadow-lg); display: flex; align-items: center; justify-content: center; z-index: 10;
  color: var(--color-primary); transition: background 0.15s;
}
.map-location-btn:hover { background: var(--color-surface-container); }

.map-sidebar { width: 100%; flex-shrink: 0; }
@media (min-width: 768px) { .map-sidebar { width: 320px; } }

.sidebar-img { width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-DEFAULT); }
.sidebar-detail { padding: 12px 0 0; }
.sidebar-name { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-on-surface); }
.sidebar-address { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
.sidebar-actions { display: flex; gap: 8px; margin-top: 12px; }

.sidebar-placeholder { text-align: center; padding: 32px 0; color: var(--color-outline); }
.sidebar-placeholder p { font-size: var(--font-size-sm); margin-top: 8px; }

.sidebar-section-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface-variant); margin: 16px 0 8px; }
.sidebar-list { max-height: 300px; overflow-y: auto; }
.sidebar-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
</style>

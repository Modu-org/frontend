<template>
  <DefaultLayout title="관광지 검색" show-back>
    <!-- 검색바 -->
    <section class="search-section">
      <div class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          :class="{ 'search-input--voice': isVoiceMode }"
          placeholder="관광지명을 입력하세요"
          @keyup.enter="doSearch()"
          @input="clearVoiceMode"
        />
        <BaseButton size="sm" @click="doSearch()">
          <span class="material-symbols-outlined">search</span>
        </BaseButton>
      </div>
    </section>

    <!-- 필터 -->
    <section class="filter-section">
      <h3 class="filter-title">지역</h3>
      <div class="region-row">
        <select v-model="selectedRegionCode" class="region-select" @change="onRegionChange">
          <option value="">시/도 선택</option>
          <option v-for="r in regionStore.regions" :key="r.regionCode" :value="String(r.regionCode)">
            {{ r.regionName }}
          </option>
        </select>
        <select
          v-model="selectedDistrictCode"
          class="region-select"
          :disabled="!selectedRegionCode || !currentDistricts.length"
          @change="onDistrictChange"
        >
          <option value="">군/구 선택</option>
          <option v-for="d in currentDistricts" :key="d.districtCode" :value="String(d.districtCode)">
            {{ d.districtName }}
          </option>
        </select>
      </div>

      <h3 class="filter-title">관광지 타입</h3>
      <div class="chip-row">
        <BaseChip
          v-for="ct in CONTENT_TYPES_FILTER"
          :key="ct.id"
          :selected="filters.contentTypeId === ct.id"
          @click="toggleContentType(ct)"
        >{{ ct.label }}</BaseChip>
      </div>

      <h3 class="filter-title">접근성 타입</h3>
      <div class="chip-row">
        <BaseChip
          v-for="field in USER_DETAIL_FIELDS"
          :key="field.key"
          :icon="field.icon"
          :selected="filters[field.apiKey]"
          @click="toggleAccessibility(field)"
        >{{ field.label }}</BaseChip>
      </div>
    </section>

    <!-- View Tabs -->
    <div class="view-tabs">
      <button :class="['vtab', { 'vtab--active': viewTab === 'list' }]" @click="viewTab = 'list'">목록으로 보기</button>
      <button :class="['vtab', { 'vtab--active': viewTab === 'map' }]" @click="viewTab = 'map'">지도에서 보기</button>
    </div>

    <!-- 결과 -->
    <section class="results-section">
      <div v-if="isLoading || !isInitialized" class="results-center"><LoadingSpinner /></div>
      <div v-else-if="attractions.length === 0" class="results-center">
        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-outline);">search_off</span>
        <p class="results-empty-text">조건에 맞는 관광지가 없습니다.</p>
        <p class="results-empty-sub">필터를 변경하거나 다른 키워드로 검색해보세요.</p>
      </div>

      <template v-else>
        <!-- 목록으로 보기 -->
        <div v-if="viewTab === 'list'" class="attraction-grid">
          <div v-for="item in attractions" :key="item.attractionId" class="attraction-card">
            <div class="attraction-card__thumb">
              <img
                :src="item.firstImageUrl || item.thumbnailImageUrl || getDefaultImg(item.contentTypeId)"
                :alt="item.name"
                class="attraction-card__img"
                @error="e => handleImgError(e, item.contentTypeId)"
              />
              <span class="attraction-card__type-badge">{{ getContentTypeLabel(item.contentTypeId) }}</span>
            </div>
            <div class="attraction-card__body">
              <h4 class="attraction-card__name">{{ item.name }}</h4>
              <p class="attraction-card__addr">{{ item.address }}</p>
              <div class="attraction-card__actions">
                <BaseButton size="sm" variant="secondary" @click="goToDetail(item)">
                  <span class="material-symbols-outlined" style="font-size:1.1em;">info</span>상세 보기
                </BaseButton>
                <BaseButton size="sm" variant="accent" @click="handleAddSchedule(item)">
                  <span class="material-symbols-outlined" style="font-size:1.1em;">add_circle</span>일정에 추가
                </BaseButton>
              </div>
            </div>
          </div>
          <div v-if="hasMore" class="load-more">
            <BaseButton variant="outline" full-width :loading="isLoadingMore" @click="loadMore">더보기</BaseButton>
          </div>
        </div>

        <!-- 지도에서 보기 -->
        <div v-else class="map-view-layout">
          <!-- 좌측/하단 관광지 리스트 -->
          <div class="map-view-sidebar">
            <h3 class="sidebar-title">검색된 관광지 목록</h3>
            <div class="sidebar-list">
              <div
                v-for="item in attractions"
                :key="item.attractionId"
                class="map-sidebar-card"
                @click="focusMapMarker(item)"
              >
                <div class="map-sidebar-card__thumb">
                  <img
                    :src="item.firstImageUrl || item.thumbnailImageUrl || getDefaultImg(item.contentTypeId)"
                    :alt="item.name"
                    class="map-sidebar-card__img"
                    @error="e => handleImgError(e, item.contentTypeId)"
                  />
                  <span class="attraction-card__type-badge" style="z-index: 1;">
                    {{ getContentTypeLabel(item.contentTypeId) }}
                  </span>
                </div>
                <div class="map-sidebar-card__body">
                  <div class="map-sidebar-card__title-row">
                    <h4 class="map-sidebar-card__name">{{ item.name }}</h4>
                    <span class="map-sidebar-card__badge">{{ getContentTypeLabel(item.contentTypeId) }}</span>
                  </div>
                  <p class="map-sidebar-card__addr">{{ item.address }}</p>
                  <div class="map-sidebar-card__actions">
                    <BaseButton size="xs" variant="secondary" @click.stop="goToDetail(item)">
                      상세 보기
                    </BaseButton>
                    <BaseButton size="xs" variant="accent" @click.stop="handleAddSchedule(item)">
                      일정에 추가
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- 지도 페이지네이션 컨트롤 -->
            <div class="map-pagination">
              <button :disabled="currentPage === 0" @click="changeMapPage(currentPage - 1)" class="pag-btn" aria-label="이전 페이지">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <span class="pag-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
              <button :disabled="!hasMore" @click="changeMapPage(currentPage + 1)" class="pag-btn" aria-label="다음 페이지">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          
          <!-- 우측/상단 지도 컨테이너 -->
          <div class="map-view-main">
            <div ref="mapContainer" class="map-container"></div>
          </div>
        </div>
      </template>
    </section>

    <!-- 음성 FAB -->
    <button
      v-if="voiceSearch.isSupported.value"
      :class="['voice-fab', { 'voice-fab--active': voiceSearch.isListening.value }]"
      :aria-label="voiceSearch.isListening.value ? '음성 인식 중지' : '음성으로 검색'"
      @click="handleVoiceSearch"
    >
      <span class="material-symbols-outlined" style="font-size:1.75rem;">
        {{ voiceSearch.isListening.value ? 'mic_off' : 'mic' }}
      </span>
    </button>

    <!-- 일정 선택 모달 -->
    <ScheduleSelectModal
      :visible="schedModal.visible"
      :attraction-id="schedModal.attractionId"
      :attraction-name="schedModal.name"
      @close="schedModal.visible = false"
    />
  </DefaultLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseChip from '@/components/common/BaseChip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ScheduleSelectModal from '@/components/common/ScheduleSelectModal.vue'
import { attractionApi } from '@/api/attractionApi'
import { useRegionStore } from '@/stores/regionStore'
import { useAuthStore } from '@/stores/authStore'
import { useVoiceSearch } from '@/composables/useVoiceSearch'
import { useToast } from '@/composables/useToast'
import { CONTENT_TYPES, CONTENT_TYPE_MAP, getDefaultImg, FALLBACK_IMG } from '@/constants/enums'

const route = useRoute()
const router = useRouter()
const regionStore = useRegionStore()
const authStore = useAuthStore()
const voiceSearch = useVoiceSearch()
const { showToast } = useToast()

const CONTENT_TYPES_FILTER = CONTENT_TYPES.filter(c =>
  ['12', '14', '39', '15', '28', '25'].includes(c.id)
)
const USER_DETAIL_FIELDS = [
  { key: 'physical',     apiKey: 'physical',     label: '지체장애·노약자', icon: 'accessible_forward' },
  { key: 'visual',       apiKey: 'visual',        label: '시각장애',        icon: 'visibility' },
  { key: 'hearing',      apiKey: 'hearing',       label: '청각장애',        icon: 'hearing' },
  { key: 'infantFamily', apiKey: 'infant_family', label: '유모차 동반',     icon: 'stroller' },
]

// 지역 드롭다운
const selectedRegionCode = ref('')
const selectedDistrictCode = ref('')
const currentDistricts = computed(() => {
  const r = regionStore.regions.find(r => String(r.regionCode) === selectedRegionCode.value)
  return r?.districts || []
})

// 검색/필터
const keyword = ref('')
const isVoiceMode = ref(false)
const filters = reactive({
  regionCode: null, sigunguCode: null, contentTypeId: null,
  physical: false, visual: false, hearing: false, infant_family: false,
})
const attractions = ref([])
const isLoading = ref(false)
const isInitialized = ref(false)  // 첫 검색 완료 여부
const isLoadingMore = ref(false)
const currentPage = ref(0)
const hasMore = ref(false)
const PAGE_SIZE = 20

// ── URL 쿼리 → 필터 복원 ──────────────────────────────────
function restoreFiltersFromQuery() {
  const q = route.query
  if (q.keyword) keyword.value = q.keyword
  if (q.regionCode) {
    filters.regionCode = String(q.regionCode)
    selectedRegionCode.value = String(q.regionCode)
  }
  if (q.sigunguCode) {
    filters.sigunguCode = String(q.sigunguCode)
    selectedDistrictCode.value = String(q.sigunguCode)
  }
  if (q.physical === 'true') filters.physical = true
  if (q.visual === 'true') filters.visual = true
  if (q.hearing === 'true') filters.hearing = true
  if (q.infant_family === 'true') filters.infant_family = true
}

// ── 필터 → URL 동기화 ──────────────────────────────────────
function syncQueryToUrl() {
  const q = {}
  if (keyword.value.trim()) q.keyword = keyword.value.trim()
  if (filters.regionCode) q.regionCode = filters.regionCode
  if (filters.sigunguCode) q.sigunguCode = filters.sigunguCode
  if (filters.contentTypeId) q.contentTypeId = filters.contentTypeId
  if (filters.physical) q.physical = 'true'
  if (filters.visual) q.visual = 'true'
  if (filters.hearing) q.hearing = 'true'
  if (filters.infant_family) q.infant_family = 'true'
  router.replace({ query: q })
}

onMounted(async () => {
  // regionStore가 아직 로드 안 됐으면 대기
  if (!regionStore.isLoaded) await regionStore.loadOnce()

  restoreFiltersFromQuery()

  // 음성 검색 결과 주입
  const state = window.history.state
  if (state?.voiceResults?.length) {
    keyword.value = route.query.voiceQuery || ''
    isVoiceMode.value = true
    attractions.value = state.voiceResults
    hasMore.value = false
    isInitialized.value = true
    const pf = state.voiceParsedFilters
    if (pf) {
      if (pf.regionCode) { filters.regionCode = String(pf.regionCode); selectedRegionCode.value = String(pf.regionCode) }
      if (pf.physical) filters.physical = true
      if (pf.visual) filters.visual = true
      if (pf.hearing) filters.hearing = true
      if (pf.infant_family) filters.infant_family = true
    }
    return
  }

  doSearch()
})

// regionStore가 늦게 로드된 경우 드롭다운 재동기화
watch(() => regionStore.isLoaded, (loaded) => {
  if (loaded && selectedRegionCode.value) {
    // 드롭다운 재반응 트리거
    const tmp = selectedRegionCode.value
    selectedRegionCode.value = ''
    selectedRegionCode.value = tmp
  }
})

function clearVoiceMode() { isVoiceMode.value = false }
function clearVoiceModeOnFilter() {
  if (isVoiceMode.value) { isVoiceMode.value = false; keyword.value = '' }
}

function onRegionChange() {
  selectedDistrictCode.value = ''
  filters.regionCode = selectedRegionCode.value || null
  filters.sigunguCode = null
  clearVoiceModeOnFilter()
  doSearch()
}
function onDistrictChange() {
  filters.sigunguCode = selectedDistrictCode.value || null
  clearVoiceModeOnFilter()
  doSearch()
}
function toggleContentType(ct) {
  clearVoiceModeOnFilter()
  filters.contentTypeId = filters.contentTypeId === ct.id ? null : ct.id
  doSearch()
}
function toggleAccessibility(field) {
  clearVoiceModeOnFilter()
  filters[field.apiKey] = !filters[field.apiKey]
  doSearch()
}

function buildParams(page = 0) {
  const p = { page, size: PAGE_SIZE }
  if (keyword.value.trim()) p.keyword = keyword.value.trim()
  if (filters.regionCode) p.regionCode = filters.regionCode
  if (filters.sigunguCode) p.sigunguCode = filters.sigunguCode
  if (filters.contentTypeId) p.contentTypeId = filters.contentTypeId
  if (filters.physical) p.physical = true
  if (filters.visual) p.visual = true
  if (filters.hearing) p.hearing = true
  if (filters.infant_family) p.infant_family = true
  return p
}

async function doSearch() {
  syncQueryToUrl()
  isLoading.value = true; currentPage.value = 0
  try {
    const { data: res } = await attractionApi.search(buildParams(0))
    const d = res.data
    attractions.value = d.content || []
    hasMore.value = (d.page + 1) < d.totalPages
    totalPages.value = d.totalPages || 1
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast('관광지 검색에 실패했습니다.', 'error')
    }
    attractions.value = []
    totalPages.value = 1
  } finally {
    isLoading.value = false
    isInitialized.value = true
  }
}

async function loadMore() {
  isLoadingMore.value = true; currentPage.value++
  try {
    const { data: res } = await attractionApi.search(buildParams(currentPage.value))
    const d = res.data
    attractions.value.push(...(d.content || []))
    hasMore.value = (d.page + 1) < d.totalPages
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast('추가 데이터를 불러오지 못했습니다.', 'error')
    }
    currentPage.value--
  } finally { isLoadingMore.value = false }
}

function getContentTypeLabel(id) { return CONTENT_TYPE_MAP[id]?.label || '기타' }

/** 이미지 로드 실패 시 fallback. dataset flag로 무한루프 방지 */
function handleImgError(e, contentTypeId) {
  if (e.target.dataset.fallback) return          // 이미 fallback 시도했으면 무시
  e.target.dataset.fallback = '1'
  e.target.src = getDefaultImg(contentTypeId)
}
function goToDetail(item) { router.push(`/attraction/${item.attractionId}`) }
const schedModal = reactive({ visible: false, attractionId: null, name: '' })

function handleAddSchedule(item) {
  if (!authStore.isAuthenticated) {
    showToast('로그인이 필요합니다.', 'error')
    router.push({ name: 'Login', query: { redirect: route.fullPath } }); return
  }
  schedModal.attractionId = item.attractionId
  schedModal.name = item.name
  schedModal.visible = true
}

async function handleVoiceSearch() {
  if (voiceSearch.isListening.value) { voiceSearch.stopListening(); return }
  try {
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`🎙️ "${raw}"`, 'info')
    isLoading.value = true
    try {
      const { data: res } = await attractionApi.voiceSearch(raw, 1)
      keyword.value = raw; isVoiceMode.value = true
      const parsed = res.data?.parsedFilters
      if (parsed) {
        if (parsed.regionCode) { filters.regionCode = String(parsed.regionCode); selectedRegionCode.value = String(parsed.regionCode) }
        if (parsed.physical) filters.physical = true
        if (parsed.visual) filters.visual = true
        if (parsed.hearing) filters.hearing = true
        if (parsed.infant_family) filters.infant_family = true
      }
      attractions.value = res.data?.content ?? res.data ?? []; hasMore.value = false
    } finally { isLoading.value = false }
  } catch (err) {
    showToast(err.message || '음성 검색에 실패했습니다.', 'error')
    isLoading.value = false
  }
}

const viewTab = ref('list')
const mapContainer = ref(null)
let kakaoMapInstance = null
const currentOverlays = ref([])
const totalPages = ref(1)

watch([viewTab, attractions], async ([vTab, newAttractions]) => {
  if (vTab === 'map') {
    await nextTick()
    initMap()
  }
}, { deep: false })

function focusMapMarker(item) {
  if (!kakaoMapInstance || !item.latitude || !item.longitude) return
  const pos = new window.kakao.maps.LatLng(item.latitude, item.longitude)
  kakaoMapInstance.panTo(pos)
}

async function changeMapPage(page) {
  if (page < 0 || page >= totalPages.value) return
  isLoading.value = true
  currentPage.value = page
  try {
    const { data: res } = await attractionApi.search(buildParams(page))
    const d = res.data
    attractions.value = d.content || []
    hasMore.value = (d.page + 1) < d.totalPages
    totalPages.value = d.totalPages || 1
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast('데이터를 불러오지 못했습니다.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

function getTypeIcon(id) {
  const val = String(id)
  if (val === '12') return 'tour'
  if (val === '14') return 'museum'
  if (val === '15') return 'festival'
  if (val === '25') return 'route'
  if (val === '28') return 'sports_soccer'
  if (val === '39') return 'restaurant'
  return 'location_on'
}

async function initMap() {
  if (!mapContainer.value) return
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key) { showToast('카카오맵 키가 없습니다.', 'error'); return }

  await new Promise(resolve => {
    if (window.kakao?.maps) { window.kakao.maps.load(resolve); return }
    const s = document.createElement('script')
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    s.onload = () => window.kakao.maps.load(resolve)
    document.head.appendChild(s)
  })

  // Clear existing overlays
  currentOverlays.value.forEach(overlay => overlay.setMap(null))
  currentOverlays.value = []

  const activeItems = attractions.value.filter(item => item.latitude && item.longitude)
  if (!activeItems.length) {
    const defaultCenter = new window.kakao.maps.LatLng(35.1795543, 129.0756416)
    kakaoMapInstance = new window.kakao.maps.Map(mapContainer.value, { center: defaultCenter, level: 7 })
    return
  }

  const center = new window.kakao.maps.LatLng(activeItems[0].latitude, activeItems[0].longitude)
  const map = new window.kakao.maps.Map(mapContainer.value, { center, level: 7 })
  kakaoMapInstance = map
  const bounds = new window.kakao.maps.LatLngBounds()

  activeItems.forEach((item) => {
    const pos = new window.kakao.maps.LatLng(item.latitude, item.longitude)
    bounds.extend(pos)

    const markerWrap = document.createElement('div')
    markerWrap.className = 'custom-attraction-marker-wrap'

    const markerEl = document.createElement('div')
    markerEl.className = 'custom-attraction-marker'
    const iconName = getTypeIcon(item.contentTypeId)
    markerEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 1.25rem;">${iconName}</span>`

    const labelEl = document.createElement('div')
    labelEl.className = 'custom-attraction-marker-label'
    labelEl.innerText = item.name

    markerWrap.appendChild(markerEl)
    markerWrap.appendChild(labelEl)
    
    markerWrap.addEventListener('click', () => {
      map.panTo(pos)
    })

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content: markerWrap,
      yAnchor: 0.9,
      xAnchor: 0.5
    })
    
    overlay.setMap(map)
    currentOverlays.value.push(overlay)
  })

  if (activeItems.length > 1) {
    map.setBounds(bounds)
  } else {
    map.setCenter(center)
  }
}
</script>

<style scoped>
.search-section { margin-bottom: 1rem; }
.search-row { display: flex; gap: 0.5rem; align-items: center; }
.search-input {
  flex: 1; padding: 0.75rem 1rem; border-radius: var(--radius-DEFAULT);
  border: 2px solid var(--color-outline-variant); background: var(--color-surface-container-lowest);
  font-size: var(--font-size-body); color: var(--color-on-surface);
  outline: none; min-height: var(--btn-height); transition: border-color 0.18s; font-family: inherit;
}
.search-input:focus { border-color: var(--color-primary); }
.search-input::placeholder { color: var(--color-outline); }
.search-input--voice { border-color: var(--color-primary); background: var(--color-primary-50); }

.filter-section { margin-bottom: 1.5rem; }
.filter-title { font-size: var(--font-size-body); font-weight: 700; color: var(--color-on-surface); margin: 0.875rem 0 0.5rem; }
.filter-title:first-child { margin-top: 0; }
.chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.region-row { display: flex; gap: 0.5rem; margin-bottom: 0.25rem; }
.region-select {
  flex: 1; min-width: 0; padding: 0.625rem 0.75rem;
  border-radius: var(--radius-DEFAULT); border: 2px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest); color: var(--color-on-surface);
  font-size: var(--font-size-sm); font-family: inherit; cursor: pointer; outline: none;
  transition: border-color 0.18s; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236F8F4E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.75rem center; padding-right: 2rem;
}
.region-select:focus { border-color: var(--color-primary); }
.region-select:disabled { opacity: 0.45; cursor: not-allowed; }

.results-section { min-height: 200px; overflow-x: hidden; width: 100%; }
.results-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; gap: 0.5rem; }
.results-empty-text { font-size: var(--font-size-body); font-weight: 600; color: var(--color-on-surface); }
.results-empty-sub { font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

/* 그리드 */
.attraction-grid {
  display: grid; grid-template-columns: 1fr; gap: 0.75rem; padding-bottom: 5rem;
  max-width: 100%; overflow-x: hidden; box-sizing: border-box;
}
.load-more { grid-column: 1 / -1; margin-top: 0.5rem; }

/* 카드 — 모바일: 가로형, 콘텐츠 높이에 맞춤, 가로 overflow 방지 */
.attraction-card {
  display: flex; flex-direction: row;
  width: 100%; box-sizing: border-box; min-width: 0;
  border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest); overflow: hidden; transition: border-color 0.18s;
}
.attraction-card:hover { border-color: var(--color-primary-300); }
/* 이미지 영역: 너비 넓힘 */
.attraction-card__thumb { position: relative; width: 40%; max-width: 150px; min-height: 110px; height: 100%; flex-shrink: 0; }
.attraction-card__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.attraction-card__type-badge {
  position: absolute; bottom: 0.4rem; right: 0.4rem;
  background: rgba(0,0,0,.55); color: #fff; backdrop-filter: blur(4px);
  font-size: var(--font-size-xs); font-weight: 700;
  padding: 0.15rem 0.4rem; border-radius: var(--radius-sm);
}
/* 카드 body: 세로 컬럼 — 이름 / 주소 / 버튼 가로 행 */
.attraction-card__body {
  flex: 1; min-width: 0; padding: 0.625rem 0.625rem;
  display: flex; flex-direction: column; justify-content: center; gap: 0.3rem; overflow: hidden;
}
/* 뷰포트 기반 글자 크기 — 화면 너비에 맞게 자동 조절 */
.attraction-card__name {
  font-size: clamp(0.75rem, 3vw, 0.9375rem); font-weight: 700; color: var(--color-on-surface);
  line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.attraction-card__addr {
  font-size: clamp(0.625rem, 2.5vw, 0.8125rem); color: var(--color-on-surface-variant);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* 버튼: 가로 한 행, 줄바꿈 없음, 컴팩트 사이즈 */
.attraction-card__actions {
  display: flex; flex-direction: row; flex-wrap: nowrap; gap: 0.3rem; margin-top: 0.25rem;
}
.attraction-card__actions :deep(button),
.attraction-card__actions :deep(a) {
  flex: 1; white-space: nowrap; min-width: 0;
  font-size: clamp(0.55rem, 2.2vw, 0.75rem) !important;
  padding: 0.3rem 0.4rem !important;
  height: auto !important;
}

/* 데스크탑: 3열 세로형 카드 */
@media (min-width: 768px) {
  .attraction-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .attraction-card { flex-direction: column; height: auto; }
  .attraction-card__thumb { width: 100%; max-width: none; height: 280px; }
  .attraction-card__body { justify-content: flex-start; padding: 0.875rem; height: 140px; overflow: hidden; gap: 0.3rem; }
  .attraction-card__name { font-size: var(--font-size-body); }
  .attraction-card__actions { flex-wrap: wrap; margin-top: auto; }
  .attraction-card__actions :deep(button),
  .attraction-card__actions :deep(a) { flex: 0 0 auto; }
}

/* FAB */
.voice-fab {
  position: fixed; bottom: calc(var(--bottom-nav-height) + 1.25rem); right: 1.25rem;
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: var(--color-primary); color: var(--color-on-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 40; transition: all 0.18s;
}
.voice-fab:hover { transform: scale(1.05); }
.voice-fab:active { transform: scale(0.95); }
.voice-fab--active { background: var(--color-error); animation: pulse-fab 1.2s infinite; }
@keyframes pulse-fab {
  0%,100% { box-shadow: 0 0 0 0 rgba(254,137,106,.5); }
  50% { box-shadow: 0 0 0 12px rgba(254,137,106,0); }
}

/* View Tabs styling */
.view-tabs { display: flex; gap: 0; border-radius: var(--radius-DEFAULT); overflow: hidden; border: 1.5px solid var(--color-primary); margin-bottom: 1.25rem; }
.vtab {
  flex: 1; padding: 0.625rem; text-align: center; font-size: var(--font-size-sm); font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s;
  background: var(--color-surface); color: var(--color-primary);
}
.vtab--active { background: var(--color-primary); color: var(--color-on-primary); }

/* Responsive Map Split Layout styling */
.map-view-layout {
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  height: calc(100vh - 280px);
  min-height: 500px;
}

@media (min-width: 768px) {
  .map-view-layout {
    flex-direction: row;
    height: 600px;
    align-items: stretch;
  }
}

.map-view-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .map-view-sidebar {
    max-width: 320px;
    flex: 0 0 320px;
  }
}

.sidebar-title {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-on-surface);
  margin-bottom: 1rem;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 4px;
}

.sidebar-list::-webkit-scrollbar {
  width: 4px;
}
.sidebar-list::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-list::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 2px;
}

/* Premium Map Sidebar Card style (horizontal split layout) */
.map-sidebar-card {
  display: flex;
  flex-direction: row;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
  min-height: 110px;
}

.map-sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--color-outline);
}

.map-sidebar-card__thumb {
  position: relative;
  width: 35%;
  max-width: 100px;
  min-height: 80px;
  flex-shrink: 0;
  background: var(--color-surface-container-high);
}

.map-sidebar-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.map-sidebar-card__body {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.625rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.25rem;
}

.map-sidebar-card__name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.map-sidebar-card__info {
  font-size: 11px;
  color: var(--color-on-surface-variant);
  margin: 0;
}

.map-sidebar-card__type {
  font-weight: 600;
  color: var(--color-primary-deep);
}

.map-sidebar-card__addr {
  font-size: 11px;
  color: var(--color-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.map-sidebar-card__actions {
  display: flex;
  gap: 0.3rem;
  width: 100%;
}

.map-sidebar-card__actions :deep(button) {
  flex: 1;
  padding: 0.25rem 0.35rem !important;
  font-size: 10px !important;
  height: auto !important;
  white-space: nowrap;
}

.map-view-main {
  flex: 2;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-outline-variant);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

@media (max-width: 767px) {
  .map-view-main {
    height: 350px;
    flex: none;
  }
}

.map-container {
  width: 100%;
  height: 100%;
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  text-align: center;
}

:deep(.custom-attraction-marker-wrap) {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
}

:deep(.custom-attraction-marker) {
  color: var(--color-primary);
  background: #ffffff;
  border: 2px solid var(--color-primary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 2;
}

:deep(.custom-attraction-marker-wrap:hover .custom-attraction-marker) {
  transform: scale(1.15) translateY(-3px);
  color: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
}

:deep(.custom-attraction-marker-label) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  margin-top: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-sidebar-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.map-sidebar-card__badge {
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  font-size: 10px;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary-200);
}

/* Map Pagination styling */
.map-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-outline-variant);
  margin-top: auto;
}

.pag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pag-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.pag-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pag-info {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-on-surface);
}
</style>

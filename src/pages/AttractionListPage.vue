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

    <!-- 결과 -->
    <section class="results-section">
      <div v-if="isLoading || !isInitialized" class="results-center"><LoadingSpinner /></div>
      <div v-else-if="attractions.length === 0" class="results-center">
        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-outline);">search_off</span>
        <p class="results-empty-text">조건에 맞는 관광지가 없습니다.</p>
        <p class="results-empty-sub">필터를 변경하거나 다른 키워드로 검색해보세요.</p>
      </div>

      <div v-else class="attraction-grid">
        <div v-for="item in attractions" :key="item.attractionId" class="attraction-card">
          <div class="attraction-card__thumb">
            <img
              :src="item.firstImageUrl || item.thumbnailImageUrl || FALLBACK_IMG"
              :alt="item.name"
              class="attraction-card__img"
              @error="onImgError"
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
  </DefaultLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseChip from '@/components/common/BaseChip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { attractionApi } from '@/api/attractionApi'
import { useRegionStore } from '@/stores/regionStore'
import { useAuthStore } from '@/stores/authStore'
import { useVoiceSearch } from '@/composables/useVoiceSearch'
import { useToast } from '@/composables/useToast'
import { CONTENT_TYPES, CONTENT_TYPE_MAP } from '@/constants/enums'

const FALLBACK_IMG = 'https://placehold.co/400x300/DCE8C7/6F8F4E?text=No+Image'

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
  } catch {
    showToast('관광지 검색에 실패했습니다.', 'error')
    attractions.value = []
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
  } catch { showToast('추가 데이터를 불러오지 못했습니다.', 'error'); currentPage.value-- }
  finally { isLoadingMore.value = false }
}

function getContentTypeLabel(id) { return CONTENT_TYPE_MAP[id]?.label || '기타' }
function onImgError(e) { e.target.src = FALLBACK_IMG }
function goToDetail(item) { router.push(`/attraction/${item.attractionId}`) }
function handleAddSchedule(item) {
  if (!authStore.isAuthenticated) {
    showToast('로그인이 필요합니다.', 'error')
    router.push({ name: 'Login', query: { redirect: route.fullPath } }); return
  }
  showToast(`${item.name}이(가) 일정에 추가되었습니다.`, 'success')
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
  .attraction-card__thumb { width: 100%; height: 280px; }
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
</style>

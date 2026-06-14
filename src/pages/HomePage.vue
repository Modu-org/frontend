<template>
  <DefaultLayout>
    <!-- Hero Banner: 전체 너비 슬롯 (항상 2.2:1 비율 유지) -->
    <template #full-bleed>
      <section class="hero">
        <div class="hero__bg">
          <img
            src="/images/banner.png"
            alt="대한민국 여행"
            class="hero__img"
          />
        </div>
        <!-- 좌측 상단 배너 타이틀/부제 텍스트 -->
        <div class="hero__text">
          <h1 class="hero__title">여행의 즐거움,<br/>모두가 누릴 수 있도록</h1>
          <p class="hero__subtitle">모두의 여행을 잇다, 이음</p>

          <!-- 주요 기능 소개 (데스크탑 전용) -->
          <div class="hero__features">
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <span class="material-symbols-outlined">accessible</span>
              </div>
              <span class="feature-label">접근성 조회</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <span class="material-symbols-outlined">mic</span>
              </div>
              <span class="feature-label">음성입력 지원</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <span class="material-symbols-outlined">photo_camera</span>
              </div>
              <span class="feature-label">맞춤 관광지 추천</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <span class="material-symbols-outlined">map</span>
              </div>
              <span class="feature-label">간편한 여행 계획</span>
            </div>
          </div>
        </div>
        <!-- 검색 영역: 배너 영역 내부 하단 배치 -->
        <div class="hero__content">
          <p v-if="voiceSearch.isListening.value" class="hero__voice-hint">
            듣고 있어요... "서울에서 휠체어 가능한 공원 찾아줘"와 같이 말씀해주세요.
          </p>
          <div class="search-bar">
            <span class="material-symbols-outlined search-bar__icon">search</span>
            <input
              v-model="searchQuery"
              class="search-bar__input"
              placeholder="검색어를 입력해주세요."
              @keyup.enter="handleSearch"
            />
            <button
              v-if="voiceSearch.isSupported.value"
              :class="['search-bar__mic', { 'search-bar__mic--active': voiceSearch.isListening.value }]"
              :aria-label="voiceSearch.isListening.value ? '음성 인식 중지' : '음성으로 검색'"
              @click="handleVoiceSearch"
            >
              <span class="material-symbols-outlined">{{ voiceSearch.isListening.value ? 'mic_off' : 'mic' }}</span>
            </button>
            <BaseButton size="sm" @click="handleSearch">검색</BaseButton>
          </div>

      
        </div>
      </section>
    </template>

    <!-- 주요 도시 카드 -->
    <section class="cities-section">
      <h2 class="section-title">
        <span class="material-symbols-outlined section-title__icon">map</span>
        어디로 떠나볼까요?
      </h2>
      <div class="city-grid">
        <button
          v-for="city in CITY_CARDS"
          :key="city.code"
          class="city-card"
          @click="goToCitySearch(city)"
        >
          <img :src="city.image" :alt="city.name" class="city-card__img" />
          <div class="city-card__overlay" />
          <div class="city-card__info">
            <span class="city-card__name">{{ city.name }}</span>
            <span class="city-card__sub">{{ city.desc }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- 🔥 인기 관광지 TOP -->
    <section class="popular-section">
      <h2 class="section-title">
        <span class="material-symbols-outlined section-title__icon" style="color: var(--color-error);">local_fire_department</span>
        인기 관광지 TOP
      </h2>

      <!-- 지역 드롭다운 -->
      <div class="popular-filter">
        <BaseSelect
          :modelValue="selectedRankingCity"
          :options="rankingRegionOptions"
          placeholder="지역 선택"
          @update:modelValue="onRankingRegionChange"
        />
      </div>

      <!-- 로딩 -->
      <div v-if="isRankingLoading" class="popular-loading">
        <LoadingSpinner />
      </div>

      <!-- 랭킹 리스트 -->
      <div v-else-if="rankingList.length" class="popular-scroll">
        <button
          v-for="(item, idx) in rankingList"
          :key="item.attractionId"
          class="rank-card"
          @click="goToAttractionDetail(item.attractionId)"
        >
          <div class="rank-card__thumb">
            <img
              :src="item.thumbnailImageUrl || FALLBACK_IMG"
              :alt="item.name"
              class="rank-card__img"
              @error="e => e.target.src = FALLBACK_IMG"
            />
            <span class="rank-card__rank" :class="`rank-card__rank--${idx + 1}`">{{ idx + 1 }}</span>
          </div>
          <div class="rank-card__body">
            <div class="rank-card__title-row">
              <span class="rank-card__name">{{ item.name }}</span>
              <span class="rank-card__badge">{{ getTypeLabel(item.contentTypeId) }}</span>
            </div>
            <span class="rank-card__addr">{{ item.address }}</span>
            <span class="rank-card__count">
              <span class="material-symbols-outlined" style="font-size: 0.875rem;">add_circle</span>
              {{ item.addedCount }}개의 일정에 추가됨
            </span>
          </div>
        </button>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="popular-empty">
        <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--color-outline);">sentiment_neutral</span>
        <p>해당 지역의 인기 관광지 데이터가 없습니다.</p>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import { attractionApi, regionApi } from '@/api/attractionApi'
import { useRegionStore } from '@/stores/regionStore'
import { useVoiceSearch } from '@/composables/useVoiceSearch'
import { useToast } from '@/composables/useToast'
import { CONTENT_TYPE_MAP, FALLBACK_IMG } from '@/constants/enums'

const router = useRouter()
const regionStore = useRegionStore()
const voiceSearch = useVoiceSearch()
const { showToast } = useToast()

const searchQuery = ref('')

const baseUrl = '/images/locations/'

const CITY_CARDS = ref([
  { name: '서울',   matchKey: '서울', desc: '수도권 핵심 관광',  image: baseUrl + 'seoul.jpg', code: '', sigunguCode: '' },
  { name: '대전',   matchKey: '대전', desc: '과학과 문화의 도시', image: baseUrl + 'daejeon.jpg', code: '', sigunguCode: '' },
  { name: '부산',   matchKey: '부산', desc: '바다와 미식의 도시', image: baseUrl + 'busan.jpg', code: '', sigunguCode: '' },
  { name: '대구',   matchKey: '대구', desc: '역사와 문화의 도시', image: baseUrl + 'daegu.jpg', code: '', sigunguCode: '' },
  { name: '제주도', matchKey: '제주', desc: '자연의 보물섬',      image: baseUrl + 'jeju.jpg', code: '', sigunguCode: '' },
  { name: '강원도', matchKey: '강원', desc: '산과 바다의 조화',   image: baseUrl + 'gangwon.jpeg', code: '', sigunguCode: '' },
  { name: '전주',   matchKey: '전주', desc: '전통과 맛의 고장',   image: baseUrl + 'jeonju.jpg', code: '', sigunguCode: '' },
  { name: '광주',   matchKey: '광주', desc: '예술과 맛의 도시',   image: baseUrl + 'gwangju.jpg', code: '', sigunguCode: '' },
])

function updateCityCodes() {
  if (!regionStore.isLoaded) return
  
  CITY_CARDS.value.forEach(city => {
    // 1. 시/도 레벨 검색 (예: '서울' -> '서울특별시', '강원' -> '강원특별자치도')
    const matchedRegion = regionStore.regions.find(r => r.regionName.includes(city.matchKey))
    if (matchedRegion) {
      city.code = String(matchedRegion.regionCode)
      city.sigunguCode = ''
      return
    }
    
    // 2. 군/구 레벨 검색 (예: '전주' -> 전북특별자치도 전주시)
    for (const r of regionStore.regions) {
      const matchedDistrict = r.districts?.find(d => d.districtName.includes(city.matchKey))
      if (matchedDistrict) {
        city.code = String(r.regionCode)
        city.sigunguCode = String(matchedDistrict.districtCode)
        return
      }
    }
  })
}




function handleSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/attractions', query: { keyword: searchQuery.value } })
}

async function handleVoiceSearch() {
  if (voiceSearch.isListening.value) { voiceSearch.stopListening(); return }
  try {
    // 1. STT: 음성 → 텍스트
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`"${raw}"`, 'info')

    // 2. 백엔드 AI 파싱 + 관광지 검색
    const { data: res } = await attractionApi.voiceSearch(raw, 1)
    const results = res.data?.content ?? res.data ?? []

    // 3. 결과를 state로 전달하여 목록 페이지로 이동
    router.push({
      path: '/attractions',
      query: { voiceQuery: raw },
      state: {
        voiceResults: results,
        voiceParsedFilters: res.data?.parsedFilters ?? null,
      },
    })
  } catch (err) {
    showToast(err.message || '음성 검색에 실패했습니다.', 'error')
  }
}

function goToCitySearch(city) {
  if (!city.code) {
    showToast('지역 코드를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.', 'info')
    return
  }
  const query = { regionCode: String(city.code) }
  if (city.sigunguCode) query.sigunguCode = String(city.sigunguCode)
  router.push({ path: '/attractions', query })
}

function goToAttractionDetail(attractionId) {
  router.push(`/attraction/${attractionId}`)
}

function getTypeLabel(id) {
  return CONTENT_TYPE_MAP[id]?.label || '관광지'
}

// ──── 인기 관광지 랭킹 ────
const selectedRankingCity = ref('')
const rankingList = ref([])
const isRankingLoading = ref(false)

async function loadRanking(regionCode) {
  if (!regionCode) return
  isRankingLoading.value = true
  try {
    const { data: res } = await regionApi.getPopularAttractions(regionCode)
    rankingList.value = res.data ?? []
  } catch {
    rankingList.value = []
  } finally {
    isRankingLoading.value = false
  }
}

const rankingRegionOptions = computed(() =>
  regionStore.regions.map(r => ({ value: String(r.regionCode), label: r.regionName }))
)

function onRankingRegionChange(val) {
  selectedRankingCity.value = val
  loadRanking(val)
}

// 첫 번째 도시의 랭킹을 초기 로드
function initRanking() {
  const first = CITY_CARDS.value.find(c => c.code)
  if (first) {
    selectedRankingCity.value = first.code
    loadRanking(first.code)
  }
}

onMounted(async () => {
  if (!regionStore.isLoaded) {
    await regionStore.loadOnce()
  }
  updateCityCodes()
  initRanking()
})
</script>

<style scoped>
/* Hero (배너 영역 2.2:1 비율 & 하단 20px 라운딩) */
.hero {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  aspect-ratio: 2.5 / 1;
}
.hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.hero__img { width: 100%; height: 100%; object-fit: cover; }

/* 좌측 상단 텍스트 영역 */
.hero__text {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  text-align: left;
  z-index: 5;
}
.hero__title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-on-surface);
  line-height: 1.35;
  margin: 0;
}
.hero__subtitle {
  font-size: 0.7rem;
  color: var(--color-primary-deep);
  font-weight: 700;
  margin-top: 0.3rem;
  margin-bottom: 0;
}

/* 주요 기능 소개 (모바일은 공간 확보를 위해 기본 숨김) */
.hero__features {
  display: none;
}

@media (min-width: 768px) {
  .hero__text {
    top: 4rem;
    left: 5.5rem;
  }
  .hero__title {
    font-size: 2.85rem;
  }
  .hero__subtitle {
    font-size: 1.25rem;
    margin-top: 0.75rem;
  }
  .hero__features {
    display: flex;
    gap: 1.5rem;
    margin-top: 1.75rem;
  }
  .feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  .feature-icon-wrap {
    width: 64px;
    height: 64px;
    background-color: #FAF6EE;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.01);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, background-color 0.2s;
  }
  .feature-icon-wrap .material-symbols-outlined {
    font-size: 28px;
    color: var(--color-primary-deep);
    transition: color 0.2s;
  }
  .feature-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary-deep);
    white-space: nowrap;
    transition: color 0.2s;
  }
  
  /* 마우스 오버 시 마이크로 인터랙션 */
  .feature-item:hover .feature-icon-wrap {
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(111, 143, 78, 0.12);
    background-color: var(--color-primary-container);
  }
  .feature-item:hover .feature-label {
    color: var(--color-primary-hover);
  }

  /* Search Bar */
  .search-bar {
  padding: 0.375rem 0.375rem 0.375rem 1rem;
  }
  .search-bar__mic .material-symbols-outlined {
    font-size: 32px;
  }
}

/* Search Bar */
.search-bar {
  display: flex; align-items: center; gap: 0.375rem;
  width: 100%; max-width: 540px; background: #fff;
  border-radius: var(--radius-DEFAULT); 
  border: 2px solid var(--color-primary-200);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-bar:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
.search-bar__icon { color: var(--color-primary); font-size: 1.5rem; flex-shrink: 0; }
.search-bar__input {
  flex: 1; border: none; outline: none; background: transparent;
  color: var(--color-on-surface);
  min-width: 0;
}
.search-bar__input::placeholder { color: var(--color-outline); }

.search-bar__mic {
  width: 2.45rem; height: 2.45rem; border-radius: var(--radius-full); border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.18s;
  background: var(--color-primary-soft); color: var(--color-primary-deep);
}
.search-bar__mic:hover { background: var(--color-primary-200); }
.search-bar__mic--active {
  background: var(--color-error); color: #fff;
  animation: pulse-mic 1.2s infinite;
}

/* 배너 내부 하단 정렬 콘텐츠 영역 */
.hero__content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1.5rem 1.5rem;
}

/* 모바일 모드 대응 (헤더 가림 및 패딩 처리) */
@media (max-width: 768px) {
  .hero {
    padding-top: calc(var(--header-height));
    aspect-ratio: auto;
  }
  .hero__bg {
    position: relative;
    aspect-ratio: 2.2 / 1;
    width: 100%;
    height: auto;
  }
  .hero__text {
    top: 1.1rem;
    left: 1.2rem;
  }
  .hero__content {
    position: absolute;
    bottom: 0;
    padding: 0 1rem 0.75rem;
  }

  /* 모바일 검색창 크기 대폭 축소 */
  .search-bar {
    max-width: 90%;
    padding: 0.25rem 0.25rem 0.25rem 0.35rem;
  }
  .search-bar__icon {
    font-size: 1.2rem;
  }
  .search-bar__input {
    font-size: 0.8rem;
  }
  .search-bar__mic {
    width: 32px;
    height: 32px;
  }
  .search-bar__mic .material-symbols-outlined {
    font-size: 1.15rem;
  }
  .search-bar :deep(button) {
    padding: 0.25rem 0.75rem;
    font-size: 0.8125rem;
    min-height: 32px;
    height: 32px;
  }
  .hero__voice-hint {
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }

  .section-title {
  font-size: var(--font-size-xl);
  }
}


.hero__voice-hint {
  color: #fff;
  font-size: var(--font-size-sm);
  margin-top: 0.75rem;
  animation: pulse 1.5s infinite;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
@keyframes pulse-mic {
  0%,100% { box-shadow: 0 0 0 0 rgba(254,137,106,.4); }
  50% { box-shadow: 0 0 0 10px rgba(254,137,106,0); }
}

/* Cities */
.cities-section {
  margin-top: 2rem;
}
.section-title {
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-on-surface); 
  margin-bottom: 1.25rem;
}
.section-title__icon { 
  color: var(--color-primary);
  font-size: 1.5em;
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (min-width: 768px) { .city-grid { grid-template-columns: repeat(4, 1fr); } }

.city-card {
  position: relative; border-radius: var(--radius-DEFAULT); overflow: hidden;
  aspect-ratio: 4 / 3; cursor: pointer; border: none; padding: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.city-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
}
.city-card:active { transform: translateY(-2px) scale(0.98); }
.city-card__img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.city-card:hover .city-card__img {
  transform: scale(1.08);
}
.city-card__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.6), transparent 60%);
}
.city-card__info {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 0.75rem; display: flex; flex-direction: column;
}
.city-card__name { font-size: var(--font-size-xl); font-weight: 700; color: #fff; }
.city-card__sub { font-size: var(--font-size-xs); color: rgba(255,255,255,.75); }

/* ── 인기 관광지 섹션 ── */
.popular-section {
  margin-top: 2.5rem;
  padding-bottom: 1rem;
}

/* 지역 드롭다운 필터 */
.popular-filter {
  max-width: 240px;
  margin-bottom: 0.5rem;
}

/* 로딩 / 빈 상태 */
.popular-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}
.popular-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 0;
  color: var(--color-outline);
  font-size: var(--font-size-sm);
}

/* 가로 스크롤 카드 컨테이너 */
.popular-scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem 0 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.popular-scroll::-webkit-scrollbar { display: none; }

/* 랭킹 카드 */
.rank-card {
  flex-shrink: 0;
  width: 200px;
  border: none;
  background: var(--color-surface-container);
  border-radius: var(--radius-DEFAULT);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.rank-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.rank-card__thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.rank-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.rank-card:hover .rank-card__img {
  transform: scale(1.06);
}

/* 순위 뱃지 */
.rank-card__rank {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
.rank-card__rank--1 { background: linear-gradient(135deg, #FFD700, #FFA000); }
.rank-card__rank--2 { background: linear-gradient(135deg, #B0BEC5, #78909C); }
.rank-card__rank--3 { background: linear-gradient(135deg, #D7A86E, #A67C52); }

.rank-card__body {
  padding: 0.625rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rank-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}
.rank-card__name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.rank-card__badge {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.1rem 0.375rem;
  border-radius: var(--radius-full);
  background: var(--color-primary-container);
  color: var(--color-primary-deep);
  white-space: nowrap;
}

.rank-card__addr {
  font-size: var(--font-size-xs);
  color: var(--color-outline);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-card__count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 600;
  margin-top: 0.125rem;
}

@media (min-width: 768px) {
  .rank-card {
    width: 220px;
  }
}
</style>

<template>
  <DefaultLayout>
    <!-- Hero Banner: 전체 너비 슬롯 -->
    <template #full-bleed>
      <section class="hero">
        <div class="hero__bg">
          <img
            src="https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1600&q=80"
            alt="대한민국 여행"
            class="hero__img"
          />
          <div class="hero__overlay" />
        </div>
        <div class="hero__content">
          <h1 class="hero__title">여행의 즐거움,<br/>모두가 누릴 수 있도록</h1>
          <p class="hero__subtitle">모두가 즐길 수 있는 여행을 다온길과 함께 계획해보세요.</p>

          <!-- Search Bar -->
          <div class="search-bar">
            <span class="material-symbols-outlined search-bar__icon">search</span>
            <input
              v-model="searchQuery"
              class="search-bar__input"
              placeholder="관광지명을 입력하세요"
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

          <p v-if="voiceSearch.isListening.value" class="hero__voice-hint">
            🎙️ 듣고 있어요... "서울에서 휠체어 가능한 공원 찾아줘"
          </p>
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
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { attractionApi } from '@/api/attractionApi'
import { useRegionStore } from '@/stores/regionStore'
import { useVoiceSearch } from '@/composables/useVoiceSearch'
import { useToast } from '@/composables/useToast'

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

onMounted(async () => {
  if (!regionStore.isLoaded) {
    await regionStore.loadOnce()
  }
  updateCityCodes()
})

function handleSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/attractions', query: { keyword: searchQuery.value } })
}

async function handleVoiceSearch() {
  if (voiceSearch.isListening.value) { voiceSearch.stopListening(); return }
  try {
    // 1. STT: 음성 → 텍스트
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`🎙️ "${raw}"`, 'info')

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
</script>

<style scoped>
/* Hero */
.hero {
  position: relative; border-radius: var(--radius-lg); overflow: hidden;
  margin: -1rem -1rem 2rem; min-height: 340px;
}
.hero__bg { position: absolute; inset: 0; }
.hero__img { width: 100%; height: 100%; object-fit: cover; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.65)); }
.hero__content {
  position: relative; z-index: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center;
  padding: 3rem 1.5rem; min-height: 340px;
}
.hero__title {
  font-size: var(--font-size-3xl); font-weight: 700; color: #fff;
  line-height: 1.2; margin-bottom: 0.5rem;
}
.hero__subtitle { font-size: var(--font-size-body); color: rgba(255,255,255,.8); margin-bottom: 1.5rem; }
.hero__voice-hint { color: rgba(255,255,255,.85); font-size: var(--font-size-sm); margin-top: 0.75rem; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }

/* Search Bar */
.search-bar {
  display: flex; align-items: center; gap: 0.375rem;
  width: 100%; max-width: 540px; background: #fff;
  border-radius: var(--radius-full); padding: 0.375rem 0.375rem 0.375rem 1rem;
}
.search-bar__icon { color: var(--color-primary); font-size: 1.5rem; flex-shrink: 0; }
.search-bar__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: var(--font-size-body); color: var(--color-on-surface);
  min-width: 0;
}
.search-bar__input::placeholder { color: var(--color-outline); }

.search-bar__mic {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.18s;
  background: var(--color-primary-soft); color: var(--color-primary-deep);
}
.search-bar__mic:hover { background: var(--color-primary-200); }
.search-bar__mic--active {
  background: var(--color-error); color: #fff;
  animation: pulse-mic 1.2s infinite;
}
@keyframes pulse-mic {
  0%,100% { box-shadow: 0 0 0 0 rgba(254,137,106,.4); }
  50% { box-shadow: 0 0 0 10px rgba(254,137,106,0); }
}

/* Cities */
.cities-section { margin-bottom: 2rem; }
.section-title {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: var(--font-size-2xl); font-weight: 700;
  color: var(--color-on-surface); margin-bottom: 1.25rem;
}
.section-title__icon { color: var(--color-primary); font-size: 1.5em; }

.city-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (min-width: 768px) { .city-grid { grid-template-columns: repeat(4, 1fr); } }

.city-card {
  position: relative; border-radius: var(--radius-DEFAULT); overflow: hidden;
  aspect-ratio: 4 / 3; cursor: pointer; border: none; padding: 0;
  transition: transform 0.18s;
}
.city-card:active { transform: scale(0.97); }
.city-card__img { width: 100%; height: 100%; object-fit: cover; }
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
</style>

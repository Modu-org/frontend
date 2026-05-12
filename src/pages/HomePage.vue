<template>
  <DefaultLayout>
    <!-- Hero Banner with Search -->
    <section class="relative -mx-[var(--space-md)] md:-mx-8 -mt-6 mb-10 overflow-hidden rounded-b-[32px] md:rounded-[var(--radius-lg)]">
      <div class="relative h-[400px] md:h-[480px]">
        <img
          src="https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1600&q=80"
          alt="대한민국 여행"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-3 drop-shadow-lg">
            여행의 즐거움,<br/>모두가 누릴 수 있도록
          </h1>
          <p class="text-base md:text-lg text-white/85 mb-8 max-w-xl">
            모두가 즐길 수 있는 여행을 모두의 여행과 함께 계획해보세요.
          </p>
          <!-- Search Bar -->
          <div class="w-full max-w-xl bg-white rounded-full flex items-center gap-2 px-2 py-2 shadow-2xl">
            <span class="material-symbols-outlined text-[var(--color-primary)] ml-4 text-2xl">search</span>
            <input
              v-model="searchQuery"
              class="flex-1 bg-transparent outline-none text-[var(--color-on-surface)] placeholder-[var(--color-outline)] px-2 py-2 text-base"
              placeholder="어디로 여행할까요? 관광지를 검색해보세요"
              @keyup.enter="handleSearch"
            />
            <button
              class="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex-shrink-0"
              @click="handleSearch"
            >
              검색
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 1: 맞춤 추천 (로그인 사용자만) -->
    <section v-if="isLoggedIn && hasProfile" class="mb-12">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h2 class="text-xl md:text-2xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
            {{ userStore.nickname }}님을 위한 맞춤 추천
          </h2>
          <p class="text-sm text-[var(--color-on-surface-variant)] mt-1">프로필 기반으로 추천해드려요</p>
        </div>
        <router-link to="/recommend" class="text-sm font-bold text-[var(--color-primary)] hover:underline flex-shrink-0">
          전체 보기 →
        </router-link>
      </div>
      <div class="scroll-row">
        <div v-for="item in customItems" :key="item.attractionId" class="scroll-card">
          <AttractionCard :attraction="item" @select="goToDetail" @add="handleAdd" />
        </div>
      </div>
    </section>

    <!-- Section 2: 부모님과 함께 하기 좋은 인기 관광지 -->
    <section class="mb-12">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h2 class="text-xl md:text-2xl font-extrabold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-500">family_restroom</span>
            부모님과 함께 하기 좋은 인기 관광지
          </h2>
          <p class="text-sm text-[var(--color-on-surface-variant)] mt-1">어르신 동반 여행에 적합한 관광지입니다</p>
        </div>
        <router-link to="/recommend" class="text-sm font-bold text-[var(--color-primary)] hover:underline flex-shrink-0">
          전체 보기 →
        </router-link>
      </div>
      <div class="scroll-row">
        <div v-for="item in parentsItems" :key="item.attractionId" class="scroll-card">
          <AttractionCard :attraction="item" @select="goToDetail" @add="handleAdd" />
        </div>
      </div>
    </section>

    <!-- Section 3: 휠체어로도 편한 여행 -->
    <section class="mb-12">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h2 class="text-xl md:text-2xl font-extrabold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <span class="material-symbols-outlined text-green-600">accessible_forward</span>
            휠체어로도 편한 여행 목록
          </h2>
          <p class="text-sm text-[var(--color-on-surface-variant)] mt-1">배리어프리 인증 관광지 모음</p>
        </div>
        <router-link to="/recommend" class="text-sm font-bold text-[var(--color-primary)] hover:underline flex-shrink-0">
          전체 보기 →
        </router-link>
      </div>
      <div class="scroll-row">
        <div v-for="item in wheelchairItems" :key="item.attractionId" class="scroll-card">
          <AttractionCard :attraction="item" @select="goToDetail" @add="handleAdd" />
        </div>
      </div>
    </section>

    <!-- Section 4: 지역별 관광지 -->
    <section class="mb-12">
      <div class="flex items-end justify-between mb-5">
        <div>
          <h2 class="text-xl md:text-2xl font-extrabold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--color-primary)]">map</span>
            지역별 관광지
          </h2>
          <p class="text-sm text-[var(--color-on-surface-variant)] mt-1">원하는 지역을 선택해 관광지를 둘러보세요</p>
        </div>
      </div>
      <!-- Region Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-5">
        <button
          v-for="region in REGIONS"
          :key="region"
          :class="[
            'flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300',
            selectedRegion === region
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-container)]'
          ]"
          @click="selectedRegion = region"
        >
          {{ region }}
        </button>
      </div>
      <div class="scroll-row">
        <div v-for="item in regionItems" :key="item.attractionId" class="scroll-card">
          <AttractionCard :attraction="item" @select="goToDetail" @add="handleAdd" />
        </div>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AttractionCard from '@/components/attraction/AttractionCard.vue'
import { useUserStore } from '@/stores/userStore'
import { MOCK_ATTRACTIONS } from '@/api/mock/mockData'

const router = useRouter()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedRegion = ref('서울')

const REGIONS = ['서울', '부산', '제주', '경주', '강릉', '전주']

const isLoggedIn = computed(() => userStore.isAuthenticated)
const hasProfile = computed(() => userStore.hasProfile)

const customItems = ref(MOCK_ATTRACTIONS.slice(0, 4))
const parentsItems = ref([...MOCK_ATTRACTIONS].filter(a => a.accessibilitySummary?.ramp === 'AVAILABLE'))
const wheelchairItems = ref([...MOCK_ATTRACTIONS].filter(a => a.accessibilitySummary?.wheelchair === 'AVAILABLE'))
const regionItems = computed(() => MOCK_ATTRACTIONS)

function handleSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/recommend', query: { keyword: searchQuery.value } })
}

function goToDetail(attraction) {
  router.push(`/attraction/${attraction.attractionId}`)
}

function handleAdd(attraction) {
  if (!userStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: '/' } })
    return
  }
  alert(`${attraction.name}을(를) 일정에 추가했습니다.`)
}
</script>

<style scoped>
.scroll-row {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-row::-webkit-scrollbar { display: none; }
.scroll-card {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>

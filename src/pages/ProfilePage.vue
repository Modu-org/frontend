<template>
  <DefaultLayout title="마이페이지" show-back>
    <!-- Profile Card -->
    <BaseCard padding="lg" elevated class="mb-8">
      <div class="flex items-center gap-5">
        <div class="w-16 h-16 bg-signature-gradient rounded-full flex items-center justify-center sunlight-shadow">
          <span class="material-symbols-outlined text-[var(--color-on-primary)] text-3xl" style="font-variation-settings: 'FILL' 1;">person</span>
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-[var(--color-on-surface)] tracking-tight">{{ authStore.userName }}</h2>
          <p class="text-sm text-[var(--color-outline)]">{{ authStore.user?.email }}</p>
        </div>
      </div>
    </BaseCard>

    <!-- 표시 설정 -->
    <h3 class="text-base font-bold text-[var(--color-on-surface-variant)] mb-4 pl-3 border-l-4 border-[var(--color-primary)]">
      표시 설정
    </h3>
    <BaseCard padding="lg" elevated class="mb-8">
      <!-- Simple Mode -->
      <div class="flex items-center justify-between mb-6 pb-6 border-b border-[var(--color-outline-variant)]/10">
        <div>
          <p class="text-base font-bold text-[var(--color-on-surface)]">간편 모드</p>
          <p class="text-sm text-[var(--color-outline)] mt-0.5">큰 글씨, 큰 버튼</p>
        </div>
        <button
          :class="toggleClass(themeStore.isSimpleMode)"
          role="switch"
          :aria-checked="themeStore.isSimpleMode"
          @click="themeStore.setMode(themeStore.isSimpleMode ? 'standard' : 'simple')"
        >
          <span :class="['absolute top-1 w-6 h-6 rounded-full shadow-md transition-transform duration-300', themeStore.isSimpleMode ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white']" />
        </button>
      </div>

      <!-- Font Scale -->
      <div class="mb-6 pb-6 border-b border-[var(--color-outline-variant)]/10">
        <p class="text-base font-bold text-[var(--color-on-surface)] mb-3">글자 크기</p>
        <input
          type="range" min="0.8" max="1.8" step="0.1"
          :value="themeStore.fontScale"
          class="w-full accent-[var(--color-primary)] h-2 bg-[var(--color-surface-container)] rounded-full cursor-pointer"
          @input="themeStore.setFontScale(Number($event.target.value))"
        />
        <div class="flex justify-between text-xs text-[var(--color-outline)] mt-1.5 font-medium">
          <span>가</span>
          <span class="text-base">가</span>
          <span class="text-xl">가</span>
        </div>
      </div>

      <!-- High Contrast -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-base font-bold text-[var(--color-on-surface)]">고대비 모드</p>
          <p class="text-sm text-[var(--color-outline)] mt-0.5">색상 대비 강화</p>
        </div>
        <button
          :class="toggleClass(themeStore.highContrast)"
          role="switch"
          :aria-checked="themeStore.highContrast"
          @click="themeStore.toggleHighContrast()"
        >
          <span :class="['absolute top-1 w-6 h-6 rounded-full shadow-md transition-transform duration-300', themeStore.highContrast ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white']" />
        </button>
      </div>
    </BaseCard>

    <!-- 온보딩 다시하기 -->
    <BaseButton full-width variant="outline" class="mb-4" @click="$router.push('/onboarding')">
      프로필 다시 설정하기
    </BaseButton>

    <!-- Logout -->
    <BaseButton full-width variant="ghost" @click="handleLogout">
      로그아웃
    </BaseButton>
  </DefaultLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

function toggleClass(active) {
  return [
    'relative w-14 h-8 rounded-full transition-colors duration-300 cursor-pointer flex-shrink-0',
    active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)]',
  ]
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

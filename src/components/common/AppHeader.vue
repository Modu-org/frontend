<template>
  <header class="sticky top-0 z-50 h-[var(--header-height)]">
    <!-- Web Nav -->
    <nav class="hidden md:flex bg-white w-full justify-between items-center px-6 py-4 shadow-sm shadow-[var(--color-on-surface)]/5 h-full">
      <img src="/images/logo.png" alt="첫 화면으로 이동" class="w-38 cursor-pointer" @click="$router.push('/')" />
      <div class="flex gap-6 items-center">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'text-sm font-semibold tracking-tight transition-colors duration-300 active:scale-95 px-3 py-1.5 rounded-full',
            $route.path === item.to
              ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/8'
              : 'text-[var(--color-outline)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]'
          ]"
        >
          {{ item.label }}
        </router-link>
      </div>
      <div class="flex items-center gap-3">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors px-3 py-1.5 rounded-full hover:bg-[var(--color-surface-container)]">
            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">account_circle</span>
            {{ authStore.userName }}
          </router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="text-sm font-bold text-[var(--color-primary)] hover:underline">로그인</router-link>
        </template>
      </div>
    </nav>

    <!-- Mobile Header -->
    <div class="md:hidden flex items-center justify-between h-full px-[var(--space-md)] bg-glass">
      <button
        v-if="showBack"
        class="p-2 rounded-[var(--radius-DEFAULT)] hover:bg-[var(--color-surface-container)] transition-colors min-w-[var(--touch-min)] min-h-[var(--touch-min)] flex items-center justify-center"
        aria-label="뒤로가기"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-[var(--color-on-surface)]">arrow_back</span>
      </button>
      <div v-else class="w-10" />
      <h1 v-if="title" class="text-lg font-extrabold tracking-tighter text-[var(--color-primary)]">
        {{ title }}
      </h1>
      <img v-else src="/images/logo.png" alt="모두의 여행 로고(홈으로 이동)" class="h-6 cursor-pointer" @click="$router.push('/')" />
      <span class="material-symbols-outlined text-[var(--color-on-surface)] text-2xl cursor-pointer">
        notifications
      </span>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
})

const authStore = useAuthStore()

const navItems = [
  { to: '/', label: '홈' },
  { to: '/recommend', label: '관광지' },
  { to: '/mypage', label: '내 여행' },
]
</script>

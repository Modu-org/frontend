<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_24px_rgba(11,28,48,0.06)] z-50 h-[var(--bottom-nav-height)]"
    role="navigation"
    aria-label="하단 메뉴"
  >
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :class="linkClasses(item.to)"
      :aria-label="item.label"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <span class="material-symbols-outlined mb-1" :style="isActive(item.to) ? 'font-variation-settings: \'FILL\' 1;' : ''">{{ item.icon }}</span>
      <span class="text-[11px] font-bold uppercase tracking-widest">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/', label: '홈', icon: 'explore' },
  { to: '/recommend', label: '관광지', icon: 'travel_explore' },
  { to: '/schedules', label: '내 여행', icon: 'luggage' },
]

function isActive(to) {
  return route.path === to
}

function linkClasses(to) {
  return [
    'flex flex-col items-center justify-center px-5 py-2 rounded-[24px] transition-all duration-200 ease-out active:scale-90',
    isActive(to)
      ? 'bg-[var(--color-primary-fixed)]/60 text-[var(--color-primary)]'
      : 'text-[var(--color-outline)] hover:bg-[var(--color-surface-container-low)]',
  ]
}
</script>

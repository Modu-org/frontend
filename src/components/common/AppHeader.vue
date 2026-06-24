<template>
  <header class="sticky top-0 left-0 w-full z-50 h-[var(--header-height)]">
    <!-- Web Nav -->
    <nav class="hidden md:flex bg-white w-full shadow-sm shadow-[var(--color-on-surface)]/5 h-full justify-center">
      <div class="flex w-full max-w-[1920px] justify-between items-center px-6 h-full">
        <img src="/images/logo.png" alt="이음 로고(홈으로 이동)" class="logo w-38 cursor-pointer" style="width:152px;height:auto;" @click="$router.push('/')" />
        <div class="flex gap-12 items-center" :class="{ 'ml-40': authStore.isAuthenticated }">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'text-sm font-semibold tracking-tight transition-colors duration-300 active:scale-95 px-3 py-1.5 rounded-[10px]',
              isRouteActive(item.to)
                ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/8'
                : 'text-[var(--color-outline)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]'
            ]"
          >
            {{ item.label }}
          </router-link>
        </div>
        <div class="flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <span class="greeting-text">{{ authStore.nickname }}님, 즐거운 여행하세요!</span>
            <NotificationBell />
            <router-link to="/profile" class="profile-circle" aria-label="마이페이지로 이동">
              <img v-if="authStore.user?.profileImg" :src="authStore.user.profileImg" alt="프로필" class="profile-circle__img" />
              <span v-else class="material-symbols-outlined profile-circle__icon" style="font-variation-settings: 'FILL' 1;">person</span>
            </router-link>
            <button class="logout-btn" aria-label="로그아웃" @click="handleLogout">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="text-sm font-bold text-[var(--color-primary)] hover:underline">로그인</router-link>
          </template>
        </div>
      </div>
    </nav>

    <!-- Mobile Header -->
    <div class="md:hidden flex items-center justify-between h-full px-[var(--space-md)] bg-white shadow-sm shadow-[var(--color-on-surface)]/5">
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
      <img v-else src="/images/logo.png" alt="이음 로고(홈으로 이동)" class="h-7 cursor-pointer" @click="$router.push('/')" />
      <!-- Mobile: 알림 + 프로필 -->
      <div v-if="authStore.isAuthenticated" class="flex items-center gap-1">
        <NotificationBell />
        <router-link to="/profile" class="profile-circle profile-circle--sm" aria-label="마이페이지">
          <img v-if="authStore.user?.profileImg" :src="authStore.user.profileImg" alt="프로필" class="profile-circle__img" />
          <span v-else class="material-symbols-outlined profile-circle__icon" style="font-variation-settings: 'FILL' 1;">person</span>
        </router-link>
      </div>
      <span v-else class="material-symbols-outlined text-[var(--color-on-surface)] text-2xl cursor-pointer" @click="$router.push('/login')">
        login
      </span>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import NotificationBell from '@/components/common/NotificationBell.vue'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const navItems = [
  { to: '/', label: '홈' },
  { to: '/attractions', label: '관광지' },
  { to: '/schedules', label: '내 여행' },
]

function isRouteActive(itemTo) {
  const path = route.path
  if (itemTo === '/') return path === '/'
  if (itemTo === '/attractions') return path === '/attractions' || path.startsWith('/attraction/')
  if (itemTo === '/schedules') return path === '/schedules' || path.startsWith('/schedule/') || path.startsWith('/mytravel')
  return path === itemTo
}

async function handleLogout() {
  await authStore.logout()
  showToast('로그아웃되었습니다.', 'info')
  router.push('/')
}
</script>

<style scoped>
.greeting-text {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-on-surface-variant);
  white-space: nowrap;
}

.profile-circle {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: box-shadow 0.2s;
  overflow: hidden; flex-shrink: 0;
}
.profile-circle:hover { box-shadow: var(--shadow-md); }

.profile-circle--sm { width: 34px; height: 34px; }

.profile-circle__img { width: 100%; height: 100%; object-fit: cover; }
.profile-circle__icon { font-size: 28px; color: var(--color-on-primary); }
.profile-circle--sm .profile-circle__icon { font-size: 22px; }

.logout-btn {
  width: 48px; height: 48px; border-radius: 50%; border: none;
  background: var(--color-surface-container); color: var(--color-outline);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.logout-btn:hover { background: var(--color-error-container); }
.logout-btn .material-symbols-outlined { font-size: 28px; }
</style>

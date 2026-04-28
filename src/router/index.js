import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/pages/OnboardingPage.vue'),
    meta: { requiresAuth: true, layout: 'auth' },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { guestAllowed: true },
  },
  {
    path: '/recommend',
    name: 'Recommend',
    component: () => import('@/pages/RecommendPage.vue'),
    meta: { guestAllowed: true },
  },
  {
    path: '/attraction/:id',
    name: 'AttractionDetail',
    component: () => import('@/pages/AttractionDetailPage.vue'),
    meta: { guestAllowed: true },
  },
  {
    path: '/board/write',
    name: 'BoardWrite',
    component: () => import('@/pages/BoardWritePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trip/:tripId/edit',
    name: 'NodeEditor',
    component: () => import('@/pages/NodeEditorPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trip/:tripId',
    name: 'TripDetail',
    component: () => import('@/pages/TripDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('@/pages/MyPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 로그인 페이지: 이미 인증된 사용자는 홈으로
  if (to.meta.requiresAuth === false) {
    if (authStore.isAuthenticated) return { name: 'Home' }
    return true
  }

  // 게스트 허용 페이지 (홈, 추천, 관광지 상세): 누구나 접근 가능
  if (to.meta.guestAllowed) {
    // 로그인 되어 있고, 프로필 미설정이면 온보딩 체크
    if (authStore.isAuthenticated && !authStore.hasProfile) {
      const skipUntil = localStorage.getItem('skipOnboardingUntil')
      if (!skipUntil || Date.now() > Number(skipUntil)) {
        return { name: 'Onboarding' }
      }
    }
    return true
  }

  // 인증 필요 페이지
  if (!authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 프로필 설정 확인 (온보딩 외)
  if (to.name !== 'Onboarding' && !authStore.hasProfile) {
    const skipUntil = localStorage.getItem('skipOnboardingUntil')
    if (!skipUntil || Date.now() > Number(skipUntil)) {
      return { name: 'Onboarding' }
    }
  }

  return true
})

export default router

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
    meta: { layout: 'auth' },
  },
  {
    path: '/oauth/success',
    name: 'OAuthCallback',
    component: () => import('@/pages/OAuthCallbackPage.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { guestAllowed: true },
  },
  {
    path: '/attractions',
    name: 'AttractionList',
    component: () => import('@/pages/AttractionListPage.vue'),
    meta: { guestAllowed: true },
  },
  {
    path: '/recommend',
    redirect: '/attractions',
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
    path: '/schedules',
    name: 'ScheduleList',
    component: () => import('@/pages/ScheduleListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mypage',
    redirect: '/schedules',
  },
  {
    path: '/schedule/:scheduleId/edit',
    name: 'NodeEditor',
    component: () => import('@/pages/NodeEditorPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/schedule/:scheduleId',
    name: 'ScheduleDetail',
    component: () => import('@/pages/ScheduleManagePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mytravel',
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
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { guestAllowed: true },
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

  // 최초 진입 시 세션 복원(tryRestoreSession) 시도가 끝나지 않았다면 대기하여 레이스 컨디션 방지
  if (!authStore.isInitialized) {
    await authStore.tryRestoreSession()
  }

  // 로그인 페이지: 이미 인증된 사용자는 redirect 또는 홈으로
  if (to.meta.requiresAuth === false) {
    if (authStore.isAuthenticated) {
      return to.query.redirect
        ? { path: decodeURIComponent(to.query.redirect) }
        : { name: 'Home' }
    }
    return true
  }

  // 게스트 허용 페이지 / 레이아웃 전용 페이지(온보딩 등)
  if (to.meta.guestAllowed || !to.meta.requiresAuth) {
    return true
  }

  // 인증 필요 페이지
  if (!authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

})

router.afterEach((to) => {
  // 관광지 목록(/attractions) 및 상세(/attraction/) 이외의 아예 다른 페이지로 이동하는 경우 세션 캐시 제거
  if (!to.path.startsWith('/attractions') && !to.path.startsWith('/attraction/')) {
    sessionStorage.removeItem('attraction_filters')
  }
})

export default router

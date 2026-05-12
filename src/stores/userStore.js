import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@/api/authApi'
import { setCookie, removeCookie } from '@/api/client'
import { useThemeStore } from './themeStore'

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export const useUserStore = defineStore('user', () => {
  /** 서버에서 내려오는 user 데이터 (API /users/me 응답) */
  const user = ref(null)
  const accessToken = ref(getCookie('accessToken') || localStorage.getItem('accessToken') || null)
  const refreshToken = ref(getCookie('refreshToken') || localStorage.getItem('refreshToken') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const hasProfile = computed(() => user.value?.ageGroupCode != null)
  const nickname = computed(() => user.value?.nickname || '여행자')

  function saveTokens(access, refresh) {
    accessToken.value = access
    refreshToken.value = refresh
    setCookie('accessToken', access, 7)
    setCookie('refreshToken', refresh, 7)
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    removeCookie('accessToken')
    removeCookie('refreshToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  /** 로그인 — POST /auth/login */
  async function login(userName, password) {
    isLoading.value = true
    try {
      const { data: res } = await authApi.login({ userName, password })
      const d = res.data
      saveTokens(d.accessToken, d.refreshToken)
      user.value = {
        userId: d.userId,
        nickname: d.nickname,
        ageGroupCode: d.ageGroupCode,
        tripStyleCode: d.tripStyleCode,
        usesWheelchair: d.usesWheelchair,
        hasStroller: d.hasStroller,
        usesWalkingAid: d.usesWalkingAid,
        hasServiceDog: d.hasServiceDog,
        needsVisualAssistance: d.needsVisualAssistance,
        uiMode: d.uiMode,
      }
      applyUiMode(d.uiMode)
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** 회원가입 — POST /auth/signup */
  async function signup(data) {
    isLoading.value = true
    try {
      const { data: res } = await authApi.signup(data)
      // 회원가입 후 자동 로그인
      await login(data.userName, data.password)
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** 로그아웃 — POST /auth/logout */
  async function logout() {
    try { await authApi.logout() } finally {
      user.value = null
      clearTokens()
    }
  }

  /** 내 정보 조회 — GET /users/me */
  async function fetchMe() {
    try {
      const { data: res } = await userApi.getMe()
      user.value = res.data
      applyUiMode(res.data.uiMode)
    } catch {
      // 인증 만료 등
    }
  }

  /** 내 정보 수정 — PATCH /users/me */
  async function updateMe(data) {
    isLoading.value = true
    try {
      const { data: res } = await userApi.updateMe(data)
      // 서버는 변경된 필드만 반환할 수 있으므로 로컬 merge
      user.value = { ...user.value, ...data }
      applyUiMode(user.value.uiMode)
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** 아이디 중복 확인 — GET /auth/check-id */
  async function checkId(userName) {
    const { data: res } = await authApi.checkId(userName)
    return res.data // { userName, available }
  }

  function applyUiMode(mode) {
    const themeStore = useThemeStore()
    if (mode === 'SIMPLE') {
      themeStore.setMode('simple')
    } else {
      themeStore.setMode('standard')
    }
  }

  return {
    user, accessToken, refreshToken, isLoading,
    isAuthenticated, hasProfile, nickname,
    login, signup, logout, fetchMe, updateMe, checkId,
  }
})

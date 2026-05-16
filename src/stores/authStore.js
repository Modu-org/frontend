import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@/api/authApi'
import { setAccessToken, clearAccessToken, tokenRef } from '@/api/tokenStore'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!tokenRef.value)
  const hasProfile = computed(() => {
    if (!user.value) return false
    const u = user.value
    return u.physical != null || u.visual != null || u.hearing != null || u.infantFamily != null
  })
  const nickname = computed(() => user.value?.nickname || '여행자')

  /** POST /auth/login */
  async function login(userName, password) {
    isLoading.value = true
    try {
      const { data: res } = await authApi.login({ userName, password })
      const d = res.data
      setAccessToken(d.accessToken)
      user.value = { userId: d.userId, nickname: d.nickname }
      try { await fetchMe() } catch { /* 토스트는 fetchMe 내부에서 처리 */ }
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** POST /auth/signup */
  async function signup(data) {
    isLoading.value = true
    try {
      const { data: res } = await authApi.signup(data)
      await login(data.userName, data.password)
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** POST /auth/logout */
  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 실패해도 로컬 정리
    } finally {
      clearAccessToken()
      user.value = null
    }
  }

  /** GET /users/me */
  async function fetchMe({ silent = false } = {}) {
    try {
      const { data: res } = await userApi.getMe()
      const d = res.data
      user.value = {
        userId: d.userId,
        userName: d.userName,
        nickname: d.nickname,
        profileImg: d.profileImg || null,
        physical: d.physical,
        visual: d.visual,
        hearing: d.hearing,
        infantFamily: d.infant_family ?? d.infantFamily,
      }
    } catch (err) {
      if (!silent) {
        const { useToast } = await import('@/composables/useToast')
        const { showToast } = useToast()
        showToast('사용자 정보를 불러오지 못했습니다.', 'error')
      }
      throw err
    }
  }

  /** PATCH /users/me */
  async function updateMe(data) {
    isLoading.value = true
    try {
      const { data: res } = await userApi.updateMe(data)
      if (user.value) {
        user.value = { ...user.value, ...data }
      }
      return res
    } finally {
      isLoading.value = false
    }
  }

  /** GET /auth/check-id */
  async function checkId(userName) {
    const { data: res } = await authApi.checkId(userName)
    return res.data
  }

  /** 앱 초기화 시 세션 복원 */
  async function tryRestoreSession() {
    try {
      const { data: res } = await authApi.refresh()
      const newToken = res.data?.accessToken || res.accessToken
      setAccessToken(newToken)
      await fetchMe({ silent: true })
    } catch {
      clearAccessToken()
      user.value = null
    }
  }

  return {
    user, isLoading,
    isAuthenticated, hasProfile, nickname,
    login, signup, logout, fetchMe, updateMe, checkId,
    tryRestoreSession,
  }
})

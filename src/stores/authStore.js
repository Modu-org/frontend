import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/authApi'
import { userApi } from '@/api/userApi'
import { setCookie, removeCookie } from '@/api/client'
import { useThemeStore } from './themeStore'

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export const useAuthStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const accessToken = ref(getCookie('accessToken') || localStorage.getItem('accessToken') || null)
  const refreshToken = ref(getCookie('refreshToken') || localStorage.getItem('refreshToken') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const hasProfile = computed(() => !!profile.value?.ageGroup)
  const userName = computed(() => user.value?.name || '여행자')

  async function login(email, password) {
    isLoading.value = true
    try {
      const { data } = await authApi.login({ email, password })
      user.value = data.user
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      // 쿠키와 localStorage 양쪽에 저장
      setCookie('accessToken', data.accessToken, 7)
      setCookie('refreshToken', data.refreshToken, 7)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      await fetchProfile()
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function register(email, password, name) {
    isLoading.value = true
    try {
      const { data } = await authApi.register({ email, password, name })
      user.value = data.user
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      setCookie('accessToken', data.accessToken, 7)
      setCookie('refreshToken', data.refreshToken, 7)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      profile.value = null
      accessToken.value = null
      refreshToken.value = null
      removeCookie('accessToken')
      removeCookie('refreshToken')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await userApi.getProfile()
      user.value = { userId: data.userId, email: data.email, name: data.name }
      profile.value = data.profile

      // 프로필 기반 테마 자동 결정
      const themeStore = useThemeStore()
      themeStore.autoDetectMode(data.profile)
    } catch {
      // 프로필 없으면 무시
    }
  }

  async function updateProfile(profileData) {
    isLoading.value = true
    try {
      const { data } = await userApi.updateProfile(profileData)
      profile.value = data.profile

      // 프로필 변경 시 테마 재적용
      const themeStore = useThemeStore()
      themeStore.autoDetectMode(data.profile)
      return data
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    profile,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated,
    hasProfile,
    userName,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
  }
})

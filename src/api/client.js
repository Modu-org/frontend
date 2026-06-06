import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()

const isProd = import.meta.env.PROD
const serverUrl = import.meta.env.VITE_API_SERVER_URL || ''
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

const finalBaseURL = isProd && apiBaseUrl.startsWith('/') && serverUrl
  ? `${serverUrl.replace(/\/$/, '')}${apiBaseUrl}`
  : apiBaseUrl

const client = axios.create({
  baseURL: finalBaseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null,
  },
})

/** Request 인터셉터 — 메모리의 accessToken을 Authorization 헤더에 첨부 */
client.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response 인터셉터 — 401 시 /auth/refresh로 토큰 재발급
 * 동시에 다수의 401 에러가 발생하는 경우 대응 
 * isRefreshing 플래그 + 대기열로 중복 refresh 방지
 */
let isRefreshing = false
let pendingQueue = []

const flushQueue = (token) =>
  pendingQueue.splice(0).forEach(({ resolve }) => resolve(token))
const rejectQueue = (err) =>
  pendingQueue.splice(0).forEach(({ reject }) => reject(err))

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRequest = originalRequest.url?.includes('/auth/')

    if (isAuthRequest || !error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // 이미 refresh 진행 중이면 대기열에 등록
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return client(originalRequest)
      })
    }

    isRefreshing = true

    try {
      let newToken = null

      // 1차: 프록시 경유 (일반 로그인 쿠키)
      try {
        const refreshUrl = isProd && apiBaseUrl.startsWith('/') && serverUrl
          ? `${serverUrl.replace(/\/$/, '')}${apiBaseUrl}/auth/refresh`
          : `${apiBaseUrl}/auth/refresh`
        const { data: res } = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true }
        )
        newToken = res.data?.accessToken || res.accessToken
      } catch {
        // fallback
      }

      // 2차: 백엔드 직접 호출 (소셜 로그인 쿠키)
      if (!newToken) {
        const serverUrl = import.meta.env.VITE_API_SERVER_URL || ''
        if (serverUrl) {
          const { data: res } = await axios.post(
            `${serverUrl}/api/auth/refresh`,
            {},
            { withCredentials: true }
          )
          newToken = res.data?.accessToken || res.accessToken
        }
      }

      if (!newToken) throw new Error('No token')

      setAccessToken(newToken)
      flushQueue(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return client(originalRequest)
    } catch (refreshError) {
      clearAccessToken()
      rejectQueue(refreshError)

      // 세션 만료 시 로그인 페이지 리다이렉션 처리 (일반 API 요청 401 시)
      if (!window.__auth_redirecting) {
        window.__auth_redirecting = true
        showToast('로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 'error')

        import('@/router').then(({ default: router }) => {
          router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          setTimeout(() => { window.__auth_redirecting = false }, 2000)
        }).catch(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
          setTimeout(() => { window.__auth_redirecting = false }, 2000)
        })
      }

      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default client

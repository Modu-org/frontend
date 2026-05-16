import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // httpOnly refresh cookie 자동 전송
  headers: {
    'Content-Type': 'application/json',
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
 */
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRequest = originalRequest.url?.includes('/auth/')

    // auth 관련 요청이 401이면 재시도 없이 바로 reject
    if (isAuthRequest || !error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const { data: res } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      const newToken = res.data?.accessToken || res.accessToken

      setAccessToken(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return client(originalRequest)
    } catch {
      clearAccessToken()
      return Promise.reject(error)
    }
  }
)

export default client

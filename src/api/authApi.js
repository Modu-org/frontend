import client from './client'
import { mockAuthApi } from './mock/mockAuth'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const authApi = {
  register(data) {
    if (useMock) return mockAuthApi.register(data)
    return client.post('/auth/register', data)
  },

  login(data) {
    if (useMock) return mockAuthApi.login(data)
    return client.post('/auth/login', data)
  },

  refresh(refreshToken) {
    if (useMock) return mockAuthApi.refresh(refreshToken)
    return client.post('/auth/refresh', { refreshToken })
  },

  logout() {
    if (useMock) return mockAuthApi.logout()
    return client.post('/auth/logout')
  },
}

import client from './client'
import { mockAuthApi, mockUserApi } from './mock/mockAuth'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const authApi = {
  signup(data) {
    if (useMock) return mockAuthApi.signup(data)
    return client.post('/auth/signup', data)
  },

  login(data) {
    if (useMock) return mockAuthApi.login(data)
    return client.post('/auth/login', data)
  },

  checkId(userName) {
    if (useMock) return mockAuthApi.checkId(userName)
    return client.get('/auth/check-id', { params: { id: userName } })
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

export const userApi = {
  getMe() {
    if (useMock) return mockUserApi.getMe()
    return client.get('/users/me')
  },

  updateMe(data) {
    if (useMock) return mockUserApi.updateMe(data)
    return client.patch('/users/me', data)
  },
}

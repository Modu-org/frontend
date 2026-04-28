import client from './client'
import { mockUserApi } from './mock/mockAuth'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const userApi = {
  getProfile() {
    if (useMock) return mockUserApi.getProfile()
    return client.get('/users/me')
  },

  updateProfile(data) {
    if (useMock) return mockUserApi.updateProfile(data)
    return client.put('/users/me/profile', data)
  },
}

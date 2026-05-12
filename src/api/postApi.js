import client from './client'
import { mockPostApi } from './mock/mockPost'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const postApi = {
  create(data) {
    if (useMock) return mockPostApi.create(data)
    return client.post('/posts', data)
  },

  getAll(params) {
    if (useMock) return mockPostApi.getAll(params)
    return client.get('/posts', { params })
  },
}

import client from './client'
import { mockRecommendationApi } from './mock/mockRecommendation'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const recommendationApi = {
  getRecommendations(data) {
    if (useMock) return mockRecommendationApi.getRecommendations(data)
    return client.post('/recommendations', data)
  },

  getVoiceRecommendations(voiceText) {
    if (useMock) return mockRecommendationApi.getVoiceRecommendations(voiceText)
    return client.post('/recommendations/voice', { voiceText }, {
      timeout: 30000 // 타임아웃 30초로 연장
    })
  },
}

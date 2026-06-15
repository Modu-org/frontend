import client from './client'
import { mockScheduleApi } from './mock/mockSchedule'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const scheduleApi = {
  create(data) {
    if (useMock) return mockScheduleApi.create(data)
    return client.post('/schedules', data)
  },

  getAll() {
    if (useMock) return mockScheduleApi.getAll()
    return client.get('/schedules')
  },

  getById(scheduleId) {
    if (useMock) return mockScheduleApi.getById(scheduleId)
    return client.get(`/schedules/${scheduleId}`)
  },

  update(scheduleId, data) {
    if (useMock) return mockScheduleApi.update(scheduleId, data)
    return client.post(`/schedules/${scheduleId}`, data)
  },

  delete(scheduleId) {
    if (useMock) return mockScheduleApi.delete(scheduleId)
    return client.delete(`/schedules/${scheduleId}`)
  },

  getSummary(scheduleId) {
    if (useMock) return mockScheduleApi.getById(scheduleId)
    return client.get(`/schedules/${scheduleId}/summary`)
  },

  // --- Nodes ---
  addNode(scheduleId, data) {
    if (useMock) return mockScheduleApi.addNode(scheduleId, data)
    return client.post(`/schedules/${scheduleId}/nodes`, data)
  },

  getNodes(scheduleId, params) {
    if (useMock) return mockScheduleApi.getNodes(scheduleId)
    return client.get(`/schedules/${scheduleId}/nodes`, { params })
  },

  getNode(scheduleId, nodeId) {
    return client.get(`/schedules/${scheduleId}/nodes/${nodeId}`)
  },

  deleteNode(scheduleId, nodeId) {
    if (useMock) return mockScheduleApi.deleteNode(scheduleId, nodeId)
    return client.delete(`/schedules/${scheduleId}/nodes/${nodeId}`)
  },

  savePlacement(scheduleId, days, unscheduledNodes) {
    return client.put(`/schedules/${scheduleId}/nodes/placement`, { days, unscheduledNodes })
  },

  // POST /schedules/{scheduleId}/auto-arrange
  autoArrange(scheduleId, data = {}) {
    return client.post(`/schedules/${scheduleId}/auto-arrange`, data, {
      timeout: 120000 // 120 seconds timeout for high-latency arrangement calculations
    })
  },

  // --- Edges ---
  getEdges(scheduleId) {
    return client.get(`/schedules/${scheduleId}/edges`)
  },

  /**
   * AI 자연어 명령으로 일정 수정
   * @param {string|number} scheduleId — 스케줄 ID
   * @param {{ date: string, text: string, apply?: boolean }} data — 명령 데이터
   */
  aiCommand(scheduleId, data) {
    return client.post(`/schedules/${scheduleId}/ai-command`, data, {
      timeout: 30000, // AI 처리 시간 고려 30초 타임아웃
    })
  },
}

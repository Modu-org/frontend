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
    if (useMock) return mockScheduleApi.getById(scheduleId) // reuse detail for mock
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

  updateNode(scheduleId, nodeId, data) {
    if (useMock) return mockScheduleApi.updateNode(scheduleId, nodeId, data)
    return client.patch(`/schedules/${scheduleId}/nodes/${nodeId}`, data)
  },

  deleteNode(scheduleId, nodeId) {
    if (useMock) return mockScheduleApi.deleteNode(scheduleId, nodeId)
    return client.delete(`/schedules/${scheduleId}/nodes/${nodeId}`)
  },

  // --- Edges ---
  getEdges(scheduleId) {
    return client.get(`/schedules/${scheduleId}/edges`)
  },
}

import client from './client'
import { mockTripApi } from './mock/mockTrip'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const tripApi = {
  create(data) {
    if (useMock) return mockTripApi.create(data)
    return client.post('/trips', data)
  },

  getAll() {
    if (useMock) return mockTripApi.getAll()
    return client.get('/trips')
  },

  getById(tripId) {
    if (useMock) return mockTripApi.getById(tripId)
    return client.get(`/trips/${tripId}`)
  },

  update(tripId, data) {
    if (useMock) return mockTripApi.update(tripId, data)
    return client.put(`/trips/${tripId}`, data)
  },

  delete(tripId) {
    if (useMock) return mockTripApi.delete(tripId)
    return client.delete(`/trips/${tripId}`)
  },

  // Node APIs
  addNode(tripId, data) {
    if (useMock) return mockTripApi.addNode(tripId, data)
    return client.post(`/trips/${tripId}/nodes`, data)
  },

  getNodes(tripId) {
    if (useMock) return mockTripApi.getNodes(tripId)
    return client.get(`/trips/${tripId}/nodes`)
  },

  updateNode(tripId, nodeId, data) {
    if (useMock) return mockTripApi.updateNode(tripId, nodeId, data)
    return client.put(`/trips/${tripId}/nodes/${nodeId}`, data)
  },

  deleteNode(tripId, nodeId) {
    if (useMock) return mockTripApi.deleteNode(tripId, nodeId)
    return client.delete(`/trips/${tripId}/nodes/${nodeId}`)
  },

  reorderNodes(tripId, orderedNodeIds) {
    if (useMock) return mockTripApi.reorderNodes(tripId, orderedNodeIds)
    return client.put(`/trips/${tripId}/nodes/reorder`, { orderedNodeIds })
  },
}

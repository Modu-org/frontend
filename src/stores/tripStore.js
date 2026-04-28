import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tripApi } from '@/api/tripApi'

export const useTripStore = defineStore('trip', () => {
  const trips = ref([])
  const currentTrip = ref(null)
  const nodes = ref([])
  const isLoading = ref(false)

  const sortedNodes = computed(() =>
    [...nodes.value].sort((a, b) => a.visitOrder - b.visitOrder)
  )

  const totalEstimatedCost = computed(() =>
    nodes.value.reduce((sum, n) => sum + (n.estimatedCost || 0), 0)
  )

  const totalDurationMinutes = computed(() =>
    nodes.value.reduce((sum, n) => sum + (n.schedule?.stayDurationMinutes || 60), 0)
  )

  async function createTrip(data) {
    isLoading.value = true
    try {
      const { data: trip } = await tripApi.create(data)
      trips.value.unshift(trip)
      currentTrip.value = trip
      nodes.value = []
      return trip
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTrips() {
    isLoading.value = true
    try {
      const { data } = await tripApi.getAll()
      trips.value = data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTripDetail(tripId) {
    isLoading.value = true
    try {
      const { data } = await tripApi.getById(tripId)
      currentTrip.value = data
      nodes.value = data.nodes || []
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function addNode(attraction) {
    if (!currentTrip.value) return
    const nodeData = {
      attractionId: attraction.attractionId,
      attraction,
      schedule: {
        stayDurationMinutes: 90,
        visitDate: null,
        plannedArrivalTime: null,
      },
      estimatedCost: attraction.estimatedCost || 0,
      costNote: attraction.costNote || '',
      accessibility: attraction.accessibility,
      recommendReason: attraction.recommendReason || '',
    }
    const { data: node } = await tripApi.addNode(currentTrip.value.tripId, nodeData)
    nodes.value.push(node)
    return node
  }

  async function removeNode(nodeId) {
    if (!currentTrip.value) return
    await tripApi.deleteNode(currentTrip.value.tripId, nodeId)
    nodes.value = nodes.value
      .filter((n) => n.nodeId !== nodeId)
      .map((n, i) => ({ ...n, visitOrder: i + 1 }))
  }

  async function reorderNodes(orderedIds) {
    if (!currentTrip.value) return
    const { data } = await tripApi.reorderNodes(currentTrip.value.tripId, orderedIds)
    nodes.value = data
  }

  async function updateNodeDuration(nodeId, minutes) {
    if (!currentTrip.value) return
    const node = nodes.value.find((n) => n.nodeId === nodeId)
    if (!node) return
    const updated = { ...node, schedule: { ...node.schedule, stayDurationMinutes: minutes } }
    await tripApi.updateNode(currentTrip.value.tripId, nodeId, updated)
    const idx = nodes.value.findIndex((n) => n.nodeId === nodeId)
    nodes.value[idx] = updated
  }

  async function updateTrip(tripId, data) {
    isLoading.value = true
    try {
      const { data: updated } = await tripApi.update(tripId, data)
      const idx = trips.value.findIndex(t => t.tripId === tripId)
      if (idx !== -1) trips.value[idx] = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTrip(tripId) {
    isLoading.value = true
    try {
      await tripApi.delete(tripId)
      trips.value = trips.value.filter(t => t.tripId !== tripId)
    } finally {
      isLoading.value = false
    }
  }

  function clearCurrentTrip() {
    currentTrip.value = null
    nodes.value = []
  }

  return {
    trips,
    currentTrip,
    nodes,
    isLoading,
    sortedNodes,
    totalEstimatedCost,
    totalDurationMinutes,
    createTrip,
    fetchTrips,
    fetchTripDetail,
    addNode,
    removeNode,
    reorderNodes,
    updateNodeDuration,
    updateTrip,
    deleteTrip,
    clearCurrentTrip,
  }
})

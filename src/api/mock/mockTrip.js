const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let mockTrips = []
let mockNodes = {}

function generateId() {
  return 'trip_' + Math.random().toString(36).substring(2, 10)
}

export const mockTripApi = {
  async create(data) {
    await delay()
    const trip = {
      tripId: generateId(),
      ...data,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    }
    mockTrips.push(trip)
    mockNodes[trip.tripId] = []
    return { data: trip }
  },

  async getAll() {
    await delay()
    return { data: [...mockTrips].reverse() }
  },

  async getById(tripId) {
    await delay()
    const trip = mockTrips.find((t) => t.tripId === tripId)
    if (!trip) throw { response: { status: 404 } }
    return { data: { ...trip, nodes: mockNodes[tripId] || [] } }
  },

  async update(tripId, data) {
    await delay()
    const idx = mockTrips.findIndex((t) => t.tripId === tripId)
    if (idx === -1) throw { response: { status: 404 } }
    mockTrips[idx] = { ...mockTrips[idx], ...data }
    return { data: mockTrips[idx] }
  },

  async delete(tripId) {
    await delay()
    mockTrips = mockTrips.filter((t) => t.tripId !== tripId)
    delete mockNodes[tripId]
    return { data: { success: true } }
  },

  async addNode(tripId, data) {
    await delay()
    if (!mockNodes[tripId]) mockNodes[tripId] = []
    const node = {
      nodeId: 'node_' + Math.random().toString(36).substring(2, 10),
      tripId,
      visitOrder: mockNodes[tripId].length + 1,
      ...data,
      createdAt: new Date().toISOString(),
    }
    mockNodes[tripId].push(node)
    return { data: node }
  },

  async getNodes(tripId) {
    await delay()
    return { data: (mockNodes[tripId] || []).sort((a, b) => a.visitOrder - b.visitOrder) }
  },

  async updateNode(tripId, nodeId, data) {
    await delay()
    const nodes = mockNodes[tripId] || []
    const idx = nodes.findIndex((n) => n.nodeId === nodeId)
    if (idx === -1) throw { response: { status: 404 } }
    nodes[idx] = { ...nodes[idx], ...data }
    return { data: nodes[idx] }
  },

  async deleteNode(tripId, nodeId) {
    await delay()
    mockNodes[tripId] = (mockNodes[tripId] || [])
      .filter((n) => n.nodeId !== nodeId)
      .map((n, i) => ({ ...n, visitOrder: i + 1 }))
    return { data: { success: true } }
  },

  async reorderNodes(tripId, orderedNodeIds) {
    await delay()
    const nodes = mockNodes[tripId] || []
    mockNodes[tripId] = orderedNodeIds.map((id, i) => {
      const node = nodes.find((n) => n.nodeId === id)
      return { ...node, visitOrder: i + 1 }
    })
    return { data: mockNodes[tripId] }
  },
}

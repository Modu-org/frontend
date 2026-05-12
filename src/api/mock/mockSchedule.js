import { MOCK_ATTRACTIONS } from './mockData'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

function ok(data, message = '성공') {
  return { data: { success: true, message, data } }
}

let schedules = []
let nodesBySchedule = {}
let nextScheduleId = 1
let nextNodeId = 1

export const mockScheduleApi = {
  async create(body) {
    await delay()
    const schedule = {
      scheduleId: nextScheduleId++,
      ...body,
      nodeCount: 0,
      totalCost: 0,
    }
    schedules.push(schedule)
    nodesBySchedule[schedule.scheduleId] = []
    return { data: { success: true, message: '여행 스케줄이 생성되었습니다.', data: schedule }, status: 701 }
  },

  async getAll() {
    await delay()
    const content = schedules.map((s) => ({
      ...s,
      nodeCount: (nodesBySchedule[s.scheduleId] || []).length,
    }))
    return ok({
      content: [...content].reverse(),
      page: 0,
      size: 10,
      totalElements: content.length,
      totalPages: Math.ceil(content.length / 10) || 1,
    }, '여행 목록 조회에 성공했습니다.')
  },

  async getById(scheduleId) {
    await delay()
    const schedule = schedules.find((s) => s.scheduleId === scheduleId)
    if (!schedule) throw { response: { status: 904, data: { success: false, message: '존재하지 않는 여행 스케줄입니다.', errorCode: 'SCHEDULE_NOT_FOUND' } } }

    const nodes = nodesBySchedule[scheduleId] || []
    // Group by visitDate
    const dayMap = {}
    nodes.forEach((n) => {
      const date = n.visitDate || schedule.startDate
      if (!dayMap[date]) dayMap[date] = []
      dayMap[date].push(n)
    })
    const days = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayNodes]) => ({ date, nodes: dayNodes.sort((a, b) => a.visitOrder - b.visitOrder) }))

    return ok({
      ...schedule,
      totalCost: nodes.reduce((s, n) => s + (n.estimatedCost || 0), 0),
      totalTimeMinutes: nodes.reduce((s, n) => s + (n.stayDurationMinutes || 0), 0),
      days,
    }, '여행 상세 조회에 성공했습니다.')
  },

  async update(scheduleId, body) {
    await delay()
    const idx = schedules.findIndex((s) => s.scheduleId === scheduleId)
    if (idx === -1) throw { response: { status: 904, data: { success: false, message: '존재하지 않는 여행 스케줄입니다.', errorCode: 'SCHEDULE_NOT_FOUND' } } }
    schedules[idx] = { ...schedules[idx], ...body }
    return ok(schedules[idx], '여행 스케줄이 수정되었습니다.')
  },

  async delete(scheduleId) {
    await delay()
    schedules = schedules.filter((s) => s.scheduleId !== scheduleId)
    delete nodesBySchedule[scheduleId]
    return ok(null, '여행 스케줄이 삭제되었습니다.')
  },

  // --- Nodes ---
  async addNode(scheduleId, body) {
    await delay()
    const nodes = nodesBySchedule[scheduleId] || []
    const attraction = MOCK_ATTRACTIONS.find((a) => a.attractionId === body.attractionId)
    const node = {
      nodeId: nextNodeId++,
      scheduleId,
      visitOrder: nodes.length + 1,
      nodeType: 'ATTRACTION',
      placeName: attraction?.name || '',
      address: attraction?.address || '',
      latitude: attraction?.latitude || 0,
      longitude: attraction?.longitude || 0,
      accessibilitySummary: attraction?.accessibilitySummary || {},
      ...body,
    }
    if (!nodesBySchedule[scheduleId]) nodesBySchedule[scheduleId] = []
    nodesBySchedule[scheduleId].push(node)
    return { data: { success: true, message: '노드가 추가되었습니다.', data: node }, status: 701 }
  },

  async getNodes(scheduleId) {
    await delay()
    const nodes = nodesBySchedule[scheduleId] || []
    return ok(nodes, '노드 목록 조회에 성공했습니다.')
  },

  async updateNode(scheduleId, nodeId, body) {
    await delay()
    const nodes = nodesBySchedule[scheduleId] || []
    const idx = nodes.findIndex((n) => n.nodeId === nodeId)
    if (idx === -1) throw { response: { status: 904, data: { success: false, message: '존재하지 않는 노드입니다.', errorCode: 'NODE_NOT_FOUND' } } }
    nodes[idx] = { ...nodes[idx], ...body }
    return ok(nodes[idx], '노드가 수정되었습니다.')
  },

  async deleteNode(scheduleId, nodeId) {
    await delay()
    nodesBySchedule[scheduleId] = (nodesBySchedule[scheduleId] || [])
      .filter((n) => n.nodeId !== nodeId)
      .map((n, i) => ({ ...n, visitOrder: i + 1 }))
    return ok(null, '노드가 삭제되었습니다.')
  },
}

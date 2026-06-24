import client from './client'

export const arrivalApi = {
  /**
   * POST /schedules/{scheduleId}/nodes/{nodeId}/arrival — 도착 확인
   * @param {number} scheduleId
   * @param {number} nodeId
   * @param {{ latitude: number, longitude: number }} data
   */
  confirmArrival(scheduleId, nodeId, data) {
    return client.post(`/schedules/${scheduleId}/nodes/${nodeId}/arrival`, data)
  },

  /**
   * GET /arrival-logs/{arrivalLogId} — 도착 정보 조회
   * @param {number} arrivalLogId
   */
  getArrivalLog(arrivalLogId) {
    return client.get(`/arrival-logs/${arrivalLogId}`)
  },
}

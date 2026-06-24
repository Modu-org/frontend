import client from './client'

export const caregiverApi = {
  /** POST /caregivers — 보호자 등록 요청 */
  register(userName) {
    return client.post('/caregivers', { userName })
  },

  /** GET /caregivers — 보호자 목록 조회 */
  getList() {
    return client.get('/caregivers')
  },

  /** DELETE /caregivers/{caregiverId} — 보호자 등록 해제 */
  remove(caregiverId) {
    return client.delete(`/caregivers/${caregiverId}`)
  },

  /** PATCH /caregivers/requests/{relationId}/accept — 보호자 요청 수락 */
  acceptRequest(relationId) {
    return client.patch(`/caregivers/requests/${relationId}/accept`)
  },

  /** DELETE /requests/{relationId}/reject — 보호자 요청 거절 */
  rejectRequest(relationId) {
    return client.delete(`/requests/${relationId}/reject`)
  },

  /** GET /caregivers/requests/received — 받은 보호자 요청 목록 */
  getReceivedRequests() {
    return client.get('/caregivers/requests/received')
  },
}

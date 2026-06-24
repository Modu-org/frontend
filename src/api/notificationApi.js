import client from './client'

export const notificationApi = {
  /** GET /notifications — 내 알림 목록 조회 */
  getAll() {
    return client.get('/notifications')
  },

  /** GET /notifications/unread-count — 읽지 않은 알림 개수 */
  getUnreadCount() {
    return client.get('/notifications/unread-count')
  },

  /** PATCH /notifications/{notificationId}/read — 알림 읽음 처리 */
  markAsRead(notificationId) {
    return client.patch(`/notifications/${notificationId}/read`)
  },

  /** DELETE /notifications/{notificationId} — 알림 삭제 */
  remove(notificationId) {
    return client.delete(`/notifications/${notificationId}`)
  },
}

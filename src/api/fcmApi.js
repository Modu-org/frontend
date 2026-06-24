import client from './client'

export const fcmApi = {
  /** POST /fcm/tokens — FCM 토큰 저장 */
  saveToken(token) {
    return client.post('/fcm/tokens', { token })
  },

  /** DELETE /fcm/tokens — FCM 토큰 비활성화 */
  deactivateToken(token) {
    return client.delete('/fcm/tokens', { data: { token } })
  },
}

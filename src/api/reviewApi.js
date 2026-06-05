import client from './client'

/**
 * 리뷰 API
 * POST   /attractions/{attractionId}/reviews          — 리뷰 작성
 * GET    /attractions/{attractionId}/reviews           — 리뷰 목록 조회 (mineOnly, sort)
 * PUT    /reviews/{reviewId}                           — 리뷰 수정
 * DELETE /reviews/{reviewId}                           — 리뷰 삭제
 * GET    /users/me/reviews                              — 내 리뷰 전체 조회
 */
export const reviewApi = {
  /** 리뷰 작성 */
  create(attractionId, data) {
    return client.post(`/attractions/${attractionId}/reviews`, data)
  },

  /**
   * 리뷰 목록 조회
   * @param {number} attractionId
   * @param {{ mineOnly?: boolean, sort?: 'LATEST'|'OLDEST'|'RATE_DESC'|'RATE_ASC' }} params
   */
  getList(attractionId, params = {}) {
    return client.get(`/attractions/${attractionId}/reviews`, { params })
  },

  /** 리뷰 수정 */
  update(reviewId, data) {
    return client.patch(`/reviews/${reviewId}`, data)
  },

  /** 리뷰 삭제 */
  remove(reviewId) {
    return client.delete(`/reviews/${reviewId}`)
  },

  /** 내 리뷰 전체 조회 */
  getMyReviews(params = {}) {
    return client.get('/users/me/reviews', { params })
  },
}

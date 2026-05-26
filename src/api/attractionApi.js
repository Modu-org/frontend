import client from './client'

/**
 * 관광지 API
 * - GET  /attractions        (목록 검색)
 * - GET  /attractions/:id   (상세 조회)
 * - POST /voice-search      (음성 텍스트 → 관광지 목록)
 */
export const attractionApi = {
  /** 관광지 목록 조회 */
  search(params = {}) {
    return client.get('/attractions', { params })
  },

  /** 관광지 상세 조회 */
  getDetail(attractionId) {
    return client.get(`/attractions/${attractionId}`)
  },

  /**
   * 음성 텍스트 기반 관광지 검색 (AI 파싱 → 관광지 목록 반환)
   * @param {string} text — 음성 인식 raw 텍스트
   * @param {number} type — 1: 관광지 검색 (기본값)
   */
  voiceSearch(text, type = 1) {
    return client.post('/voice-search', { text, type })
  },
}

/** GET /regions — 시/군구 법정동 코드 목록 */
export const regionApi = {
  getAll() {
    return client.get('/regions')
  },
}

/** POST /posts, GET /posts */
export const postApi = {
  create(data) {
    return client.post('/posts', data)
  },
  getList(params = {}) {
    return client.get('/posts', { params })
  },
}

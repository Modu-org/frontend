import client from './client'
export const authApi = {
  /** POST /auth/signup */
  signup(data) {
    return client.post('/auth/signup', data)
  },

  /** POST /auth/login */
  login(data) {
    return client.post('/auth/login', data)
  },

  /** POST /auth/logout */
  logout() {
    return client.post('/auth/logout')
  },

  /** POST /auth/refresh */
  refresh() {
    return client.post('/auth/refresh')
  },

  /** GET /auth/check-id?userName=xxx */
  checkId(userName) {
    return client.get('/auth/check-id', { params: { userName } })
  },
}

/**
 * User API — /users/me 엔드포인트도 '완료' 상태
 */
export const userApi = {
  /** GET /users/me */
  getMe() {
    return client.get('/users/me')
  },

  /** PATCH /users/me */
  updateMe(data) {
    return client.patch('/users/me', data)
  },
}

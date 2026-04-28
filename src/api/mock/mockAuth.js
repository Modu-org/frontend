import { MOCK_USER } from './mockData'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let mockUsers = [{ ...MOCK_USER, password: 'test1234' }]
let mockProfile = null

export const mockAuthApi = {
  async register({ email, password, name }) {
    await delay()
    if (mockUsers.find((u) => u.email === email)) {
      throw { response: { status: 409, data: { message: '이미 가입된 이메일입니다.' } } }
    }
    const user = { userId: mockUsers.length + 1, email, name, password, profile: null }
    mockUsers.push(user)
    const tokens = { accessToken: `mock_access_${user.userId}`, refreshToken: `mock_refresh_${user.userId}` }
    return { data: { user: { userId: user.userId, email, name }, ...tokens } }
  },

  async login({ email, password }) {
    await delay()
    const user = mockUsers.find((u) => u.email === email && u.password === password)
    if (!user) {
      throw { response: { status: 401, data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } } }
    }
    const tokens = { accessToken: `mock_access_${user.userId}`, refreshToken: `mock_refresh_${user.userId}` }
    return { data: { user: { userId: user.userId, email: user.email, name: user.name }, ...tokens } }
  },

  async refresh() {
    await delay(100)
    return { data: { accessToken: 'mock_access_refreshed' } }
  },

  async logout() {
    await delay(100)
    return { data: { success: true } }
  },
}

export const mockUserApi = {
  async getProfile() {
    await delay()
    return { data: { ...MOCK_USER, profile: mockProfile } }
  },

  async updateProfile(data) {
    await delay()
    mockProfile = { ...mockProfile, ...data }
    return { data: { ...MOCK_USER, profile: mockProfile } }
  },
}

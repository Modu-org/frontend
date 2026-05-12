import { MOCK_USER } from './mockData'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let mockUsers = [{ ...MOCK_USER, password: 'test1234' }]
let profileStore = { ...MOCK_USER }

/** API 명세 응답 래퍼 */
function ok(data, message = '성공', code = 700) {
  return { data: { success: true, message, data }, status: code }
}
function created(data, message) {
  return { data: { success: true, message, data }, status: 701 }
}
function fail(status, message, errorCode) {
  throw { response: { status, data: { success: false, message, errorCode } } }
}

export const mockAuthApi = {
  async signup({ userName, password, nickname, ...profile }) {
    await delay()
    if (mockUsers.find((u) => u.userName === userName)) {
      fail(909, '이미 사용 중인 아이디입니다.', 'DUPLICATE_USER_NAME')
    }
    const user = { userId: mockUsers.length + 1, userName, password, nickname, ...profile }
    mockUsers.push(user)
    profileStore = { ...user }
    return created(
      { userId: user.userId, userName, nickname },
      '회원가입이 완료되었습니다.'
    )
  },

  async login({ userName, password }) {
    await delay()
    const user = mockUsers.find((u) => u.userName === userName && u.password === password)
    if (!user) {
      fail(901, '아이디 또는 비밀번호가 일치하지 않습니다.', 'LOGIN_FAILED')
    }
    profileStore = { ...user }
    return ok({
      accessToken: `mock_access_${user.userId}`,
      refreshToken: `mock_refresh_${user.userId}`,
      userId: user.userId,
      nickname: user.nickname,
      ageGroupCode: user.ageGroupCode ?? null,
      tripStyleCode: user.tripStyleCode ?? null,
      usesWheelchair: user.usesWheelchair ?? false,
      hasStroller: user.hasStroller ?? false,
      usesWalkingAid: user.usesWalkingAid ?? false,
      hasServiceDog: user.hasServiceDog ?? false,
      needsVisualAssistance: user.needsVisualAssistance ?? false,
      uiMode: user.uiMode ?? 'STANDARD',
    }, '로그인에 성공했습니다.')
  },

  async checkId(userName) {
    await delay(100)
    const exists = mockUsers.some((u) => u.userName === userName)
    return ok(
      { userName, available: !exists },
      exists ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.'
    )
  },

  async refresh() {
    await delay(100)
    return ok({ accessToken: 'mock_access_refreshed' }, 'Access Token이 재발급되었습니다.')
  },

  async logout() {
    await delay(100)
    return ok(null, '로그아웃되었습니다.')
  },
}

export const mockUserApi = {
  async getMe() {
    await delay()
    const { password, ...safe } = profileStore
    return ok(safe, '내 정보 조회에 성공했습니다.')
  },

  async updateMe(data) {
    await delay()
    profileStore = { ...profileStore, ...data }
    const { password, ...safe } = profileStore
    return ok(
      { userId: safe.userId, nickname: safe.nickname, uiMode: safe.uiMode },
      '내 정보가 수정되었습니다.'
    )
  },
}

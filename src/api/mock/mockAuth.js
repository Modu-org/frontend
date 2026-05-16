/**
 * Mock Auth/User API — 실제 백엔드 연동 완료됨
 * 이 파일은 오프라인 개발/테스트 시 fallback으로 사용 가능
 */
import { MOCK_USER } from './mockData'

const users = [{ ...MOCK_USER, password: 'password1234' }]

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms))
}

function success(data, message = '성공') {
  return { data: { success: true, message, data } }
}

function error(message, errorCode, status = 400) {
  const err = new Error(message)
  err.response = { data: { success: false, message, errorCode }, status }
  throw err
}

export const mockAuthApi = {
  async login({ userName, password }) {
    await delay()
    const user = users.find((u) => u.userName === userName)
    if (!user || user.password !== password) {
      error('아이디 또는 비밀번호가 일치하지 않습니다.', 'LOGIN_FAILED', 901)
    }
    return success({
      accessToken: `mock_access_${user.userId}`,
      userId: user.userId,
      nickname: user.nickname,
    }, '로그인에 성공했습니다.')
  },

  async signup(data) {
    await delay()
    if (users.some((u) => u.userName === data.userName)) {
      error('이미 사용 중인 아이디입니다.', 'DUPLICATE_USER_NAME', 909)
    }
    const newUser = {
      userId: users.length + 1,
      userName: data.userName,
      nickname: data.nickname,
      profileImg: null,
      physical: data.physical || 0,
      visual: data.visual || 0,
      hearing: data.hearing || 0,
      infantFamily: data.infant_family || 0,
      password: data.password,
    }
    users.push(newUser)
    return success({ userId: newUser.userId, userName: newUser.userName, nickname: newUser.nickname }, '회원가입이 완료되었습니다.')
  },

  async logout() {
    await delay(100)
    return success(null, '로그아웃되었습니다.')
  },

  async checkId(userName) {
    await delay(200)
    const exists = users.some((u) => u.userName === userName)
    return success({ userName, available: !exists })
  },
}

export const mockUserApi = {
  async getMe() {
    await delay()
    const user = users[0]
    return success({
      userId: user.userId,
      userName: user.userName,
      nickname: user.nickname,
      profileImg: user.profileImg,
      physical: user.physical,
      visual: user.visual,
      hearing: user.hearing,
      infant_family: user.infantFamily,
    }, '내 정보 조회에 성공했습니다.')
  },

  async updateMe(data) {
    await delay()
    Object.assign(users[0], data)
    return success({ userId: users[0].userId, nickname: users[0].nickname }, '내 정보가 수정되었습니다.')
  },
}

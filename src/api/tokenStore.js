import { ref, readonly } from 'vue'

/**
 * Access Token 메모리에 저장
 * 브라우저 저장소에 저장하지 않고, Vue ref로 유지.
 * - Vue 컴포넌트/computed: tokenRef 를 import해서 사용
 * - Axios 인터셉터: getAccessToken()으로 현재 값 동기 조회
 */
const _tokenRef = ref(null)

export function getAccessToken() {
  return _tokenRef.value
}

export function setAccessToken(token) {
  _tokenRef.value = token
}

export function clearAccessToken() {
  _tokenRef.value = null
}

/** 읽기 전용 반응형 ref (외부에서 변조 불가) */
export const tokenRef = readonly(_tokenRef)

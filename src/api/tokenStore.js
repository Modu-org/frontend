import { ref } from 'vue'

/**
 * Access Token 메모리에 저장 
 * 브라우저 저장소에 저장하지 않고, Vue ref로 유지.
 * - Vue 컴포넌트/computed: tokenRef 를 import해서 사용 
 * - Axios 인터셉터: getAccessToken()으로 현재 값 동기 조회
 */
const tokenRef = ref(null)

export function getAccessToken() {
  return tokenRef.value
}

export function setAccessToken(token) {
  tokenRef.value = token
}

export function clearAccessToken() {
  tokenRef.value = null
}

/** Vue 반응형 ref 직접 노출 (computed 의존성 추적용) */
export { tokenRef }

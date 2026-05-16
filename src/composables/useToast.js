import { ref } from 'vue'

const toasts = ref([])
let _id = 0

/**
 * 간단한 토스트 알림 composable
 * 사용: const { showToast } = useToast()
 *       showToast('회원가입 완료!', 'success')
 */
export function useToast() {
  function showToast(message, type = 'info', duration = 3000) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  return { toasts, showToast }
}

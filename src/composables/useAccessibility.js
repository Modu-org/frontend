import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 접근성 유틸리티 composable
 */
export function useAccessibility() {
  /**
   * 스크린 리더에 메시지를 전달 (aria-live region)
   */
  function announceToScreenReader(message) {
    const region = document.getElementById('aria-live-region')
    if (region) {
      region.textContent = ''
      nextTick(() => {
        region.textContent = message
      })
    }
  }

  /**
   * 모달 등에서 포커스 트랩
   */
  function trapFocus(containerEl) {
    if (!containerEl) return null

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return

      const focusable = containerEl.querySelectorAll(focusableSelector)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }

    containerEl.addEventListener('keydown', handleKeyDown)

    return () => {
      containerEl.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * prefers-reduced-motion 감지
   */
  const prefersReducedMotion = ref(false)

  function checkMotionPreference() {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  onMounted(() => {
    checkMotionPreference()
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    mql.addEventListener('change', checkMotionPreference)
    onUnmounted(() => mql.removeEventListener('change', checkMotionPreference))
  })

  return {
    announceToScreenReader,
    trapFocus,
    prefersReducedMotion,
  }
}

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 반응형 breakpoint 감지 composable
 */
export function useResponsive() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const breakpoint = ref('desktop')

  function update() {
    const w = window.innerWidth
    isMobile.value = w <= 768
    isTablet.value = w > 768 && w <= 1024
    isDesktop.value = w > 1024
    breakpoint.value = isMobile.value ? 'mobile' : isTablet.value ? 'tablet' : 'desktop'
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, isTablet, isDesktop, breakpoint }
}

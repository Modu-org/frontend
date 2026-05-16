import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 테마 스토어 — 심플모드 전용 (앱이 장애인·노약자 대상이므로 항상 simple)
 * 사용자가 조절 가능한 것은 글자 크기(fontScale)만 유지
 */
export const useThemeStore = defineStore('theme', () => {
  const fontScale = ref(Number(localStorage.getItem('fontScale')) || 1.2)

  function setFontScale(scale) {
    fontScale.value = scale
    localStorage.setItem('fontScale', String(scale))
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    // 항상 simple 모드
    root.setAttribute('data-theme', 'simple')
    root.style.setProperty('--font-scale', String(fontScale.value))
  }

  // 앱 시작 시 테마 적용
  applyTheme()

  return {
    fontScale,
    setFontScale,
    applyTheme,
  }
})

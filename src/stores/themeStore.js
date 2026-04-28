import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(localStorage.getItem('themeMode') || 'standard')
  const fontScale = ref(Number(localStorage.getItem('fontScale')) || 1)
  const highContrast = ref(localStorage.getItem('highContrast') === 'true')

  const isSimpleMode = computed(() => mode.value === 'simple')

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem('themeMode', newMode)
    applyTheme()
  }

  function setFontScale(scale) {
    fontScale.value = scale
    localStorage.setItem('fontScale', String(scale))
    applyTheme()
  }

  function toggleHighContrast() {
    highContrast.value = !highContrast.value
    localStorage.setItem('highContrast', String(highContrast.value))
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement

    // 테마 모드
    if (mode.value === 'simple') {
      root.setAttribute('data-theme', 'simple')
    } else {
      root.removeAttribute('data-theme')
    }

    // 고대비
    if (highContrast.value) {
      root.setAttribute('data-contrast', 'high')
    } else {
      root.removeAttribute('data-contrast')
    }

    // 폰트 스케일 (사용자 커스텀)
    root.style.setProperty('--font-scale', String(fontScale.value))
  }

  /** 프로필 기반 자동 모드 결정 (기획서 4.1.3) */
  function autoDetectMode(profile) {
    if (!profile) return
    const isElderly = profile.ageGroup === 'OVER_70'
    const hasMobilityAid = profile.mobilityAid && profile.mobilityAid !== 'NONE'

    if (isElderly || hasMobilityAid) {
      setMode('simple')
    } else {
      setMode('standard')
    }
  }

  // 앱 시작 시 테마 적용
  applyTheme()

  return {
    mode,
    fontScale,
    highContrast,
    isSimpleMode,
    setMode,
    setFontScale,
    toggleHighContrast,
    applyTheme,
    autoDetectMode,
  }
})

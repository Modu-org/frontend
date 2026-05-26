import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 1.0 = 기본(16px), 1.25 = 큰글씨(20px), 1.5 = 더 큰글씨(24px)
  const fontScale = ref(Number(localStorage.getItem('fontScale')) || 1.2)

  function setFontScale(scale) {
    fontScale.value = scale
    localStorage.setItem('fontScale', String(scale))
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    // html font-size를 scale에 맞게 변경 → rem 단위 전체 비례 변경
    // 이미지(px 고정), 로고(.logo class) 등은 영향 없음
    root.style.setProperty('--font-scale', String(fontScale.value))
    // html font-size 직접 변경으로 rem 연동
    root.style.fontSize = `calc(16px * ${fontScale.value})`
  }

  applyTheme()

  return { fontScale, setFontScale, applyTheme }
})

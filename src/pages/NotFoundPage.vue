<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[var(--color-surface)] px-6 py-12 text-center">
    <div class="max-w-md w-full space-y-8 bg-white/60 backdrop-blur-md p-8 rounded-[24px] border border-[var(--color-outline-variant)]/40 shadow-xl shadow-[var(--color-primary-fixed)]/5 relative overflow-hidden">
      <!-- 배경 데코레이션 블러 효과 -->
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary-soft)] rounded-full blur-3xl opacity-60"></div>
      <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-[var(--color-accent-soft)] rounded-full blur-3xl opacity-40"></div>

      <div class="relative z-10 space-y-6">
        <!-- 일러스트 및 아이콘 영역 -->
        <div class="flex justify-center">
          <div class="w-24 h-24 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary-deep)] animate-bounce">
            <span class="material-symbols-outlined text-5xl">travel_explore</span>
          </div>
        </div>

        <!-- 에러 제목 -->
        <div class="space-y-2">
          <h1 class="text-7xl font-black tracking-widest bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-deep)] bg-clip-text text-transparent">
            404
          </h1>
          <h2 class="text-xl font-bold text-[var(--color-on-surface)]">
            원하시는 페이지를 찾을 수 없습니다
          </h2>
        </div>

        <!-- 에러 상세 안내 설명 (한국어) -->
        <p class="text-sm text-[var(--color-on-surface-variant)] leading-relaxed word-break-keep-all">
          요청하신 페이지의 주소가 잘못 입력되었거나,<br />
          변경 혹은 삭제되어 현재 접근할 수 없습니다.<br />
          입력하신 주소가 올바른지 다시 한번 확인해주세요.
        </p>

        <!-- 이동 버튼 그룹 -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <button
            @click="goBack"
            class="px-5 py-3 rounded-[12px] border-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm font-bold hover:bg-[var(--color-surface-container-low)] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            이전 페이지로
          </button>
          <button
            @click="goHome"
            class="px-5 py-3 rounded-[12px] bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-deep)] active:scale-95 transition-all duration-200 shadow-md shadow-[var(--color-primary)]/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-lg">home</span>
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 이전 페이지로 돌아가기
function goBack() {
  router.back()
}

// 홈 화면으로 이동
function goHome() {
  router.push('/')
}
</script>

<style scoped>
.word-break-keep-all {
  word-break: keep-all;
}
</style>

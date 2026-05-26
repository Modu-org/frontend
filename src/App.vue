<template>
  <router-view />
  <ToastContainer />
  <!-- 스크린 리더용 aria-live 영역 -->
  <div id="aria-live-region" class="aria-live-region" aria-live="polite" aria-atomic="true" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useRegionStore } from '@/stores/regionStore'
import { useAuthStore } from '@/stores/authStore'
import ToastContainer from '@/components/common/ToastContainer.vue'

const themeStore = useThemeStore()
const regionStore = useRegionStore()
const authStore = useAuthStore()

onMounted(async () => {
  themeStore.applyTheme()
  // 법정동 코드 전역 로드 (1회)
  regionStore.loadOnce()
  // 세션 복원
  authStore.tryRestoreSession()
})
</script>

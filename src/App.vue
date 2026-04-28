<template>
  <router-view />
  <!-- 스크린 리더용 aria-live 영역 -->
  <div id="aria-live-region" class="aria-live-region" aria-live="polite" aria-atomic="true" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.applyTheme()
})
</script>

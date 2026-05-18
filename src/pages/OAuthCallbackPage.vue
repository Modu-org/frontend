<template>
  <div class="oauth-callback">
    <LoadingSpinner v-if="!errorMsg" />
    <div v-else class="oauth-error">
      <span class="material-symbols-outlined" style="font-size: 48px; color: var(--color-error);">error</span>
      <h2>로그인 실패</h2>
      <p>{{ errorMsg }}</p>
      <BaseButton @click="$router.push('/login')">로그인 페이지로 이동</BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { setAccessToken } from '@/api/tokenStore'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const errorMsg = ref('')

onMounted(async () => {
  // 소셜 로그인 실패 시 ?error= 파라미터가 붙음
  if (route.query.error) {
    errorMsg.value = '소셜 로그인에 실패했습니다. 다시 시도해주세요.'
    return
  }

  // 소셜 로그인 성공: 백엔드가 refresh_token을 httpOnly 쿠키에 저장함
  // 쿠키가 백엔드 도메인에 저장되므로 백엔드 URL로 직접 refresh 요청
  try {
    const serverUrl = import.meta.env.VITE_API_SERVER_URL || ''
    const { data: res } = await axios.post(
      `${serverUrl}/api/auth/refresh`,
      {},
      { withCredentials: true }
    )
    const token = res.data?.accessToken || res.accessToken
    if (token) {
      setAccessToken(token)
      await authStore.fetchMe({ silent: true }).catch(() => {})
      showToast(`${authStore.nickname}님 환영합니다!`, 'success')
      router.replace('/')
    } else {
      errorMsg.value = '인증 정보를 가져오지 못했습니다.'
    }
  } catch {
    errorMsg.value = '토큰 발급에 실패했습니다. 다시 로그인해주세요.'
  }
})
</script>

<style scoped>
.oauth-callback {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--color-surface);
}
.oauth-error {
  text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: 16px; padding: 32px;
}
.oauth-error h2 { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-on-surface); }
.oauth-error p { font-size: var(--font-size-base); color: var(--color-on-surface-variant); }
</style>

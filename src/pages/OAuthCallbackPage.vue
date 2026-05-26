<template>
  <div class="oauth-page">
    <!-- 로딩 상태 -->
    <div v-if="phase === 'loading'" class="oauth-center">
      <LoadingSpinner />
      <p class="oauth-loading-text">로그인 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="phase === 'error'" class="oauth-center">
      <span class="material-symbols-outlined" style="font-size: 48px; color: var(--color-error);">error</span>
      <h2 class="oauth-error-title">로그인 실패</h2>
      <p class="oauth-error-desc">{{ errorMsg }}</p>
      <BaseButton @click="$router.push('/login')">로그인 페이지로 이동</BaseButton>
    </div>

    <!-- 온보딩 (접근성 프로필 없는 소셜 신규 사용자) -->
    <div v-else-if="phase === 'onboarding'" class="onboarding">
      <div class="onboarding__content">
        <div class="onboarding__headline">
          <h1 class="onboarding__title">{{ authStore.nickname }}님, 환영합니다!</h1>
          <p class="onboarding__desc">편한 여행을 위해 해당하는 항목을 선택해주세요. (복수 선택 가능)</p>
        </div>
        <div class="onboarding__body">
          <div class="option-grid">
            <button
              v-for="field in USER_DETAIL_FIELDS"
              :key="field.key"
              :class="['option-card', { 'option-card--selected': form[field.key] }]"
              @click="form[field.key] = form[field.key] ? 0 : 1"
            >
              <span class="material-symbols-outlined option-card__icon">{{ field.icon }}</span>
              <span class="option-card__label">{{ field.label }}</span>
              <span v-if="form[field.key]" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            </button>
          </div>
          <button :class="['none-btn', { 'none-btn--selected': noneSelected }]" @click="clearAll">
            <span class="material-symbols-outlined" style="font-size: 20px;">check</span>
            해당 없음
          </button>
        </div>
      </div>
      <div class="onboarding__bottom">
        <BaseButton full-width :loading="isSaving" @click="saveProfile">
          저장하기
          <span class="material-symbols-outlined">check</span>
        </BaseButton>
        <div class="onboarding__skip">
          <button class="skip-link" @click="skipAndGo">나중에 설정하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { setAccessToken } from '@/api/tokenStore'
import { useToast } from '@/composables/useToast'
import { USER_DETAIL_FIELDS } from '@/constants/enums'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const phase = ref('loading') // 'loading' | 'error' | 'onboarding'
const errorMsg = ref('')
const isSaving = ref(false)

const form = reactive({ physical: 0, visual: 0, hearing: 0, infantFamily: 0 })
const noneSelected = computed(() => !form.physical && !form.visual && !form.hearing && !form.infantFamily)
function clearAll() { form.physical = 0; form.visual = 0; form.hearing = 0; form.infantFamily = 0 }

onMounted(async () => {
  if (route.query.error) {
    errorMsg.value = '소셜 로그인에 실패했습니다. 다시 시도해주세요.'
    phase.value = 'error'
    return
  }

  try {
    const serverUrl = import.meta.env.VITE_API_SERVER_URL || ''
    const { data: res } = await axios.post(
      `${serverUrl}/api/auth/refresh`, {}, { withCredentials: true }
    )
    const token = res.data?.accessToken || res.accessToken
    if (!token) { errorMsg.value = '인증 정보를 가져오지 못했습니다.'; phase.value = 'error'; return }

    setAccessToken(token)
    await authStore.fetchMe({ silent: true }).catch(() => {})
    showToast(`${authStore.nickname}님 환영합니다!`, 'success')

    // 프로필 있으면 바로 홈, 없으면 온보딩
    if (authStore.hasProfile) {
      router.replace('/')
    } else {
      phase.value = 'onboarding'
    }
  } catch {
    errorMsg.value = '토큰 발급에 실패했습니다. 다시 로그인해주세요.'
    phase.value = 'error'
  }
})

async function saveProfile() {
  isSaving.value = true
  try {
    await authStore.updateMe({
      userName: authStore.user?.userName,
      nickname: authStore.user?.nickname,
      physical: form.physical,
      visual: form.visual,
      hearing: form.hearing,
      infant_family: form.infantFamily,
    })
    await authStore.fetchMe({ silent: true }).catch(() => {})
    showToast('접근성 정보가 저장되었습니다! 🎉', 'success')
    router.replace('/')
  } catch (err) {
    showToast(err?.response?.data?.message || '저장 중 오류가 발생했습니다.', 'error')
  } finally {
    isSaving.value = false
  }
}

function skipAndGo() {
  router.replace('/')
}
</script>

<style scoped>
.oauth-page { min-height: 100vh; background: var(--color-background); }

.oauth-center {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1rem; padding: 2rem;
  text-align: center;
}
.oauth-loading-text { color: var(--color-on-surface-variant); font-size: var(--font-size-body); }
.oauth-error-title { font-size: var(--font-size-2xl); font-weight: 700; }
.oauth-error-desc { font-size: var(--font-size-body); color: var(--color-on-surface-variant); }

/* 온보딩 (OnboardingPage 스타일 재사용) */
.onboarding {
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--color-background); padding: 2rem 1.25rem;
}
.onboarding__content { flex: 1; display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; width: 100%; }
.onboarding__headline { margin-bottom: 2rem; }
.onboarding__title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-on-surface); line-height: 1.3; }
.onboarding__desc { font-size: var(--font-size-body); color: var(--color-on-surface-variant); margin-top: 0.5rem; }
.onboarding__body { flex: 1; }
.onboarding__bottom { max-width: 480px; margin: 0 auto; width: 100%; padding-top: 1.5rem; }
.onboarding__skip { text-align: center; margin-top: 0.75rem; }

.option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
.option-card {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.5rem;
  padding: 1.5rem 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 2px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  cursor: pointer; transition: all 0.18s; min-height: 100px;
}
.option-card--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-100);
}
.option-card__icon { font-size: 2rem; color: var(--color-primary-deep); }
.option-card__label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-on-surface); }
.option-card__check { position: absolute; top: 0.5rem; right: 0.5rem; color: var(--color-primary); font-size: 1.25rem; }

.none-btn {
  width: 100%; padding: 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 2px solid var(--color-outline-variant); background: var(--color-surface-container-lowest);
  font-size: var(--font-size-sm); font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.375rem;
  transition: all 0.18s;
}
.none-btn--selected { border-color: var(--color-primary); background: var(--color-primary-100); }

.skip-link {
  background: none; border: none; cursor: pointer;
  color: var(--color-on-surface-variant); font-size: var(--font-size-sm);
  font-weight: 500; text-decoration: underline;
}
</style>

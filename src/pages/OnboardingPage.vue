<template>
  <div class="onboarding">
    <div class="onboarding__content">
      <div class="onboarding__headline">
        <h1 class="onboarding__title">맞춤형 여행 추천을 위해<br/>해당하는 항목을 선택해주세요.</h1>
        <p class="onboarding__desc">(복수 선택 가능)</p>
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
      <BaseButton full-width :loading="isSubmitting" @click="handleComplete">
        {{ isSocialMode ? '저장하기' : '가입 완료' }}
        <span class="material-symbols-outlined">check</span>
      </BaseButton>
      <div class="onboarding__skip">
        <button class="skip-link" @click="handleSkip">{{ isSocialMode ? '나중에 설정하기' : '건너뛰고 가입하기' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { USER_DETAIL_FIELDS } from '@/constants/enums'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const isSubmitting = ref(false)
const signupData = ref(null)

// 소셜 로그인 후 프로필 설정 모드 (sessionStorage 데이터 없는 경우)
const isSocialMode = computed(() => authStore.isAuthenticated && !signupData.value)

const form = reactive({
  physical: 0,
  visual: 0,
  hearing: 0,
  infantFamily: 0,
})

const noneSelected = computed(() =>
  !form.physical && !form.visual && !form.hearing && !form.infantFamily
)

onMounted(() => {
  const raw = sessionStorage.getItem('signupData')
  if (raw) {
    signupData.value = JSON.parse(raw)
    return
  }
  // 소셜 로그인 사용자: 로그인 상태면 프로필 설정 모드로 진행
  if (!authStore.isAuthenticated) {
    router.replace('/login')
  }
})

function clearAll() {
  form.physical = 0
  form.visual = 0
  form.hearing = 0
  form.infantFamily = 0
}

async function doSignup() {
  if (!signupData.value) return
  isSubmitting.value = true
  try {
    await authStore.signup({
      userName: signupData.value.userName,
      password: signupData.value.password,
      nickname: signupData.value.nickname,
      physical: form.physical,
      visual: form.visual,
      hearing: form.hearing,
      infant_family: form.infantFamily,
    })
    sessionStorage.removeItem('signupData')
    showToast('회원가입이 완료되었습니다! 🎉', 'success')
    router.push('/')
  } catch (err) {
    showToast(err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function doSocialProfile() {
  isSubmitting.value = true
  try {
    await authStore.updateMe({
      userName: authStore.user?.userName,
      nickname: authStore.user?.nickname,
      physical: form.physical,
      visual: form.visual,
      hearing: form.hearing,
      infant_family: form.infantFamily,
    })
    // fetchMe로 프로필 갱신
    await authStore.fetchMe({ silent: true }).catch(() => {})
    showToast('접근성 정보가 저장되었습니다! 🎉', 'success')
    router.push('/')
  } catch (err) {
    showToast(err?.response?.data?.message || '저장 중 오류가 발생했습니다.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function handleComplete() {
  if (isSocialMode.value) doSocialProfile()
  else doSignup()
}

function handleSkip() {
  clearAll()
  if (isSocialMode.value) doSocialProfile()
  else doSignup()
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--color-surface);
}
.onboarding__content {
  flex: 1; display: flex; flex-direction: column;
  padding: 32px 20px 0; max-width: 32rem; margin: 0 auto; width: 100%;
}
.onboarding__headline { margin-bottom: 32px; }
.onboarding__title {
  font-size: var(--font-size-2xl); font-weight: 800;
  color: var(--color-on-surface); line-height: 1.3;
}
.onboarding__desc { font-size: var(--font-size-lg); color: var(--color-on-surface-variant); margin-top: 8px; }
.onboarding__body { flex: 1; }

.option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }

.option-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 12px; min-height: 120px;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-primary-200);
  color: var(--color-on-surface-variant);
  border: 2px solid transparent;
  cursor: pointer; transition: all 0.2s;
}
.option-card:hover { background: var(--color-surface-container); }
.option-card:active { transform: scale(0.97); }
.option-card--selected {
  background: var(--color-primary); color: var(--color-on-primary);
  border-color: var(--color-primary); box-shadow: var(--shadow-md);
}
.option-card__icon { font-size: 36px; margin-bottom: 8px; }
.option-card__label { font-size: var(--font-size-base); font-weight: 700; }
.option-card__check { position: absolute; top: 8px; right: 8px; font-size: 18px; }

.none-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 16px; border-radius: var(--radius-DEFAULT);
  font-size: var(--font-size-base); font-weight: 700;
  background: var(--color-surface-container-low); color: var(--color-on-surface-variant);
  border: none; cursor: pointer; transition: all 0.2s;
}
.none-btn:hover { background: var(--color-surface-container); }
.none-btn--selected { background: var(--color-surface-container-high); color: var(--color-on-surface); }

.onboarding__bottom {
  position: sticky; bottom: 0; padding: 16px 20px;
  max-width: 32rem; margin: 0 auto; width: 100%;
}
.onboarding__skip { display: flex; justify-content: center; padding: 12px 0; }
.skip-link {
  font-size: var(--font-size-sm); color: var(--color-outline);
  background: none; border: none; cursor: pointer; font-weight: 500;
}
.skip-link:hover { color: var(--color-primary); }
</style>

<template>
  <AuthLayout>
    <div class="login-logo">
      <img src="/images/logo.png" alt="다온길 로고" @click="$router.push('/')" />
      <p class="login-subtitle">모두가 함께하는 배리어프리 여행 플래너</p>
    </div>

    <BaseCard padding="lg" elevated>
      <!-- Tab switcher -->
      <div class="login-tabs">
        <button
          v-for="tab in ['login', 'register']"
          :key="tab"
          :class="['login-tab', { 'login-tab--active': activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab === 'login' ? '로그인' : '회원가입' }}
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="login-fields">
          <!-- 아이디 -->
          <div class="field-with-action">
            <BaseInput
              v-model="form.userName"
              label="아이디"
              placeholder="아이디를 입력하세요"
              required
              :error="errors.userName"
              @input="resetIdCheck"
            />
            <button
              v-if="activeTab === 'register'"
              type="button"
              class="check-btn"
              :disabled="!form.userName.trim() || isCheckingId"
              @click="handleCheckId"
            >
              {{ isCheckingId ? '확인 중...' : '중복 확인' }}
            </button>
          </div>
          <p v-if="idCheckResult !== null && activeTab === 'register'" :class="['id-check-msg', idCheckResult ? 'id-check-msg--ok' : 'id-check-msg--fail']">
            {{ idCheckResult ? '✓ 사용 가능한 아이디입니다.' : '✗ 이미 사용 중인 아이디입니다.' }}
          </p>

          <!-- 닉네임 (회원가입) -->
          <BaseInput
            v-if="activeTab === 'register'"
            v-model="form.nickname"
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            required
            :error="errors.nickname"
          />

          <!-- 비밀번호 -->
          <BaseInput
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력"
            required
            :error="errors.password"
          />

          <p v-if="serverError" class="login-error" role="alert">{{ serverError }}</p>

          <BaseButton type="submit" full-width :loading="authStore.isLoading" size="lg">
            {{ activeTab === 'login' ? '로그인' : '다음 단계' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const activeTab = ref('login')
const serverError = ref('')
const form = reactive({ userName: '', nickname: '', password: '' })
const errors = reactive({ userName: '', nickname: '', password: '' })

const idCheckResult = ref(null)
const isCheckingId = ref(false)

watch(activeTab, () => {
  serverError.value = ''
  idCheckResult.value = null
  errors.userName = errors.nickname = errors.password = ''
})

function resetIdCheck() {
  idCheckResult.value = null
}

async function handleCheckId() {
  if (!form.userName.trim()) return
  isCheckingId.value = true
  try {
    const result = await authStore.checkId(form.userName)
    idCheckResult.value = result.available
    errors.userName = result.available ? '' : '이미 사용 중인 아이디입니다.'
  } catch (err) {
    errors.userName = err?.response?.data?.message || '아이디 확인 중 오류가 발생했습니다.'
    idCheckResult.value = null
  } finally {
    isCheckingId.value = false
  }
}

function validate() {
  errors.userName = errors.nickname = errors.password = ''
  let valid = true
  if (!form.userName.trim()) { errors.userName = '아이디를 입력해주세요.'; valid = false }
  if (activeTab.value === 'register' && !form.nickname.trim()) { errors.nickname = '닉네임을 입력해주세요.'; valid = false }
  if (form.password.length < 8) { errors.password = '비밀번호는 8자 이상이어야 합니다.'; valid = false }
  if (activeTab.value === 'register' && idCheckResult.value !== true) {
    errors.userName = errors.userName || '아이디 중복 확인을 해주세요.'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  serverError.value = ''
  try {
    if (activeTab.value === 'login') {
      await authStore.login(form.userName, form.password)
      showToast(`${authStore.nickname}님 환영합니다!`, 'success')
      router.push(router.currentRoute.value.query.redirect || '/')
    } else {
      // 회원가입: 기본 정보를 sessionStorage에 임시 저장 → 온보딩으로 이동
      sessionStorage.setItem('signupData', JSON.stringify({
        userName: form.userName,
        password: form.password,
        nickname: form.nickname,
      }))
      router.push('/onboarding')
    }
  } catch (err) {
    serverError.value = err?.response?.data?.message || '오류가 발생했습니다. 다시 시도해주세요.'
  }
}
</script>

<style scoped>
.login-logo { text-align: center; margin-bottom: 32px; }
.login-logo img { width: 160px; cursor: pointer; margin: 0 auto; }
.login-subtitle { font-size: var(--font-size-lg); color: var(--color-on-surface-variant); margin-top: 8px; }

.login-tabs {
  display: flex; margin-bottom: 24px;
  background: var(--color-surface-container-low);
  border-radius: var(--radius-md); padding: 4px;
}
.login-tab {
  flex: 1; padding: 10px; border-radius: 20px;
  font-size: var(--font-size-base); font-weight: 700;
  border: none; cursor: pointer; background: none;
  color: var(--color-outline); transition: all 0.2s;
}
.login-tab--active {
  background: var(--color-surface-container-lowest);
  color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.login-fields { display: flex; flex-direction: column; gap: 16px; }
.login-error { font-size: var(--font-size-sm); color: var(--color-error); text-align: center; font-weight: 500; }

.field-with-action { display: flex; gap: 8px; align-items: flex-end; }
.field-with-action > :first-child { flex: 1; }

.check-btn {
  height: var(--btn-height); padding: 0 16px; border-radius: var(--radius-DEFAULT);
  font-size: var(--font-size-sm); font-weight: 700; white-space: nowrap;
  background: var(--color-surface-container-high); color: var(--color-on-surface);
  border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.check-btn:hover:not(:disabled) { background: var(--color-primary); color: var(--color-on-primary); }
.check-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.id-check-msg { font-size: var(--font-size-sm); font-weight: 500; margin-top: -8px; padding-left: 4px; }
.id-check-msg--ok { color: #2E7D52; }
.id-check-msg--fail { color: var(--color-error); }
</style>

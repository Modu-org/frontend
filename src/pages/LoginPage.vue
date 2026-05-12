<template>
  <AuthLayout>
    <div class="login-logo">
      <img src="/images/logo.png" alt="모두의 여행 로고" @click="$router.push('/')" />
      <p class="login-subtitle">배리어프리 여행 플래너</p>
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
          <BaseInput
            v-model="form.userName"
            label="아이디"
            placeholder="아이디를 입력하세요"
            required
            :error="errors.userName"
          />
          <BaseInput
            v-if="activeTab === 'register'"
            v-model="form.nickname"
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            required
            :error="errors.nickname"
          />
          <BaseInput
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력"
            required
            :error="errors.password"
          />

          <p v-if="serverError" class="login-error" role="alert">{{ serverError }}</p>

          <BaseButton type="submit" full-width :loading="userStore.isLoading" size="lg">
            {{ activeTab === 'login' ? '로그인' : '회원가입' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const serverError = ref('')
const form = reactive({ userName: '', nickname: '', password: '' })
const errors = reactive({ userName: '', nickname: '', password: '' })

function validate() {
  errors.userName = errors.nickname = errors.password = ''
  let valid = true
  if (!form.userName.trim()) { errors.userName = '아이디를 입력해주세요.'; valid = false }
  if (activeTab.value === 'register' && !form.nickname.trim()) { errors.nickname = '닉네임을 입력해주세요.'; valid = false }
  if (form.password.length < 8) { errors.password = '비밀번호는 8자 이상이어야 합니다.'; valid = false }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  serverError.value = ''
  try {
    if (activeTab.value === 'login') {
      await userStore.login(form.userName, form.password)
      router.push(router.currentRoute.value.query.redirect || '/')
    } else {
      await userStore.signup({
        userName: form.userName,
        password: form.password,
        nickname: form.nickname,
        uiMode: 'STANDARD',
      })
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
</style>

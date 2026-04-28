<template>
  <AuthLayout>
    <!-- Logo -->
    <div class="text-center mb-10">
      <img src="/images/logo.png" alt="모두의 여행 로고" class="w-40 cursor-pointer" @click="$router.push('/')" />
      <p class="text-[var(--font-size-lg)] text-[var(--color-on-surface-variant)] leading-relaxed">배리어프리 여행 플래너</p>
    </div>

    <BaseCard padding="lg" elevated>
      <!-- Tab switcher -->
      <div class="flex mb-8 bg-[var(--color-surface-container-low)] rounded-[24px] p-1.5">
        <button
          v-for="tab in ['login', 'register']"
          :key="tab"
          :class="[
            'flex-1 py-3 rounded-[20px] text-[var(--font-size-base)] font-bold tracking-tight transition-all duration-300',
            activeTab === tab
              ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] sunlight-shadow'
              : 'text-[var(--color-outline)]'
          ]"
          @click="activeTab = tab"
        >
          {{ tab === 'login' ? '로그인' : '회원가입' }}
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-5">
          <BaseInput
            v-if="activeTab === 'register'"
            v-model="form.name"
            label="이름"
            placeholder="홍길동"
            required
            :error="errors.name"
          />
          <BaseInput
            v-model="form.email"
            label="이메일"
            type="email"
            placeholder="trip@example.com"
            required
            :error="errors.email"
          />
          <BaseInput
            v-model="form.password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력"
            required
            :error="errors.password"
          />

          <p v-if="serverError" class="text-[var(--font-size-sm)] text-[var(--color-error)] text-center font-medium" role="alert">
            {{ serverError }}
          </p>

          <BaseButton type="submit" full-width :loading="authStore.isLoading" size="lg">
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
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')
const serverError = ref('')
const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })

function validate() {
  errors.name = errors.email = errors.password = ''
  let valid = true
  if (activeTab.value === 'register' && !form.name.trim()) { errors.name = '이름을 입력해주세요.'; valid = false }
  if (!form.email.trim() || !form.email.includes('@')) { errors.email = '올바른 이메일을 입력해주세요.'; valid = false }
  if (form.password.length < 8) { errors.password = '비밀번호는 8자 이상이어야 합니다.'; valid = false }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  serverError.value = ''
  try {
    if (activeTab.value === 'login') {
      await authStore.login(form.email, form.password)
      router.push(router.currentRoute.value.query.redirect || '/')
    } else {
      await authStore.register(form.email, form.password, form.name)
      router.push('/onboarding')
    }
  } catch (err) {
    serverError.value = err?.response?.data?.message || '오류가 발생했습니다. 다시 시도해주세요.'
  }
}
</script>

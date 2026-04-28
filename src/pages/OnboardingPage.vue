<template>
  <div class="min-h-screen bg-[var(--color-surface)] flex flex-col">
    <!-- Step bar at top -->
    <div class="px-5 pt-4 pb-2">
      <StepIndicator :current="step" :total="3" />
    </div>

    <div class="flex-1 flex flex-col px-5 md:px-0 md:max-w-lg md:mx-auto md:w-full">
      <!-- Headline -->
      <div class="mt-8 mb-8">
        <h1 class="text-[var(--font-size-3xl)] font-extrabold text-[var(--color-on-surface)] tracking-tight leading-tight">
          {{ stepTitle[step - 1] }}
        </h1>
        <p class="text-[var(--font-size-lg)] text-[var(--color-on-surface-variant)] mt-3 leading-relaxed">
          {{ stepDescription[step - 1] }}
        </p>
      </div>

      <!-- Step 1: 이동 보조기기 -->
      <div v-if="step === 1" class="flex-1">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <button
            v-for="ma in MOBILITY_OPTIONS"
            :key="ma.value"
            :class="mobilityClass(form.mobilityAid === ma.value)"
            @click="form.mobilityAid = ma.value"
          >
            <span class="material-symbols-outlined text-4xl mb-2" :style="form.mobilityAid === ma.value ? 'font-variation-settings: \'FILL\' 1;' : ''">{{ ma.icon }}</span>
            <span class="text-[var(--font-size-base)] font-bold">{{ ma.label }}</span>
            <span v-if="form.mobilityAid === ma.value" class="absolute top-3 right-3 material-symbols-outlined text-[var(--color-on-primary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
        <button
          :class="noneClass(form.mobilityAid === 'NONE')"
          @click="form.mobilityAid = 'NONE'"
        >
          <span class="material-symbols-outlined text-xl" :style="form.mobilityAid === 'NONE' ? 'font-variation-settings: \'FILL\' 1;' : ''">check</span>
          해당 없음
        </button>
      </div>

      <!-- Step 2: 연령대 -->
      <div v-if="step === 2" class="flex-1">
        <div class="grid grid-cols-2 gap-4">
          <button
            v-for="ag in AGE_GROUPS"
            :key="ag.value"
            :class="mobilityClass(form.ageGroup === ag.value)"
            @click="form.ageGroup = ag.value"
          >
            <span class="material-symbols-outlined text-4xl mb-2">{{ ag.icon }}</span>
            <span class="text-[var(--font-size-base)] font-bold">{{ ag.label }}</span>
            <span v-if="form.ageGroup === ag.value" class="absolute top-3 right-3 material-symbols-outlined text-[var(--color-on-primary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
      </div>

      <!-- Step 3: 여행 유형 -->
      <div v-if="step === 3" class="flex-1">
        <div class="grid grid-cols-2 gap-4">
          <button
            v-for="tt in TRAVEL_TYPES"
            :key="tt.value"
            :class="mobilityClass(form.travelType === tt.value)"
            @click="form.travelType = tt.value"
          >
            <span class="material-symbols-outlined text-4xl mb-2">{{ tt.icon }}</span>
            <span class="text-[var(--font-size-base)] font-bold">{{ tt.label }}</span>
            <span v-if="form.travelType === tt.value" class="absolute top-3 right-3 material-symbols-outlined text-[var(--color-on-primary)] text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sticky bottom -->
    <div class="sticky bottom-0 p-5 md:max-w-lg md:mx-auto md:w-full">
      <div class="flex gap-3 mb-3">
        <BaseButton v-if="step > 1" variant="ghost" @click="step--" class="flex-shrink-0">
          <span class="material-symbols-outlined">arrow_back</span>
        </BaseButton>
        <BaseButton
          v-if="step < 3"
          full-width
          :disabled="!canNext"
          @click="step++"
        >
          다음 단계
          <span class="material-symbols-outlined">arrow_forward</span>
        </BaseButton>
        <BaseButton
          v-if="step === 3"
          full-width
          :loading="authStore.isLoading"
          @click="handleComplete"
        >
          완료
          <span class="material-symbols-outlined">check</span>
        </BaseButton>
      </div>
      <!-- 건너뛰기 옵션 -->
      <div class="flex justify-center gap-6 py-2">
        <button
          class="text-sm text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors font-medium"
          @click="handleSkipNow"
        >
          그냥 넘어가기
        </button>
        <span class="text-[var(--color-outline-variant)]">|</span>
        <button
          class="text-sm text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors font-medium"
          @click="handleSkipWeek"
        >
          일주일 간 보지 않기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import StepIndicator from '@/components/common/StepIndicator.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const form = reactive({ ageGroup: '', mobilityAid: '', travelType: '' })

const stepTitle = ['편한 여행을 위해\n알려주세요', '연령대를\n선택해주세요', '여행 동반\n형태를 선택해주세요']
const stepDescription = [
  '도움이 필요한 부분을 선택해주세요.',
  '맞춤 여행 추천을 위해 알려주세요.',
  '함께 떠나는 분과의 관계를 선택해주세요.',
]

const MOBILITY_OPTIONS = [
  { value: 'MANUAL_WHEELCHAIR', label: '수동 휠체어', icon: 'accessible_forward' },
  { value: 'ELECTRIC_WHEELCHAIR', label: '전동 휠체어', icon: 'electric_moped' },
  { value: 'STROLLER', label: '유모차 동반', icon: 'stroller' },
  { value: 'WALKER', label: '보행 보조기', icon: 'elderly' },
]

const AGE_GROUPS = [
  { value: 'CHILD', label: '어린이', icon: 'child_care' },
  { value: 'TEEN', label: '청소년', icon: 'school' },
  { value: 'ADULT', label: '성인', icon: 'person' },
  { value: 'SENIOR', label: '시니어', icon: 'elderly_woman' },
]

const TRAVEL_TYPES = [
  { value: 'SOLO', label: '혼자', icon: 'person' },
  { value: 'COUPLE', label: '커플', icon: 'favorite' },
  { value: 'FAMILY', label: '가족', icon: 'family_restroom' },
  { value: 'GROUP', label: '단체', icon: 'groups' },
]

const canNext = computed(() => {
  if (step.value === 1) return !!form.mobilityAid
  if (step.value === 2) return !!form.ageGroup
  return true
})

function mobilityClass(selected) {
  return [
    'relative flex flex-col items-center justify-center p-6 rounded-[var(--radius-DEFAULT)] transition-all duration-300 cursor-pointer',
    'min-h-[120px]',
    selected
      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] sunlight-shadow scale-[1.02]'
      : 'bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] active:scale-[0.97]',
  ]
}

function noneClass(selected) {
  return [
    'w-full flex items-center justify-center gap-2 p-5 rounded-[var(--radius-DEFAULT)] transition-all duration-300 cursor-pointer',
    'text-[var(--font-size-base)] font-bold',
    selected
      ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]'
      : 'bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]',
  ]
}

async function handleComplete() {
  await authStore.updateProfile(form)
  router.push('/')
}

function handleSkipNow() {
  // 세션 동안만 (24시간)
  localStorage.setItem('skipOnboardingUntil', String(Date.now() + 86400000))
  router.push('/')
}

function handleSkipWeek() {
  localStorage.setItem('skipOnboardingUntil', String(Date.now() + 604800000))
  router.push('/')
}
</script>

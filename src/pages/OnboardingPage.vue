<template>
  <div class="onboarding">
    <div class="onboarding__step-bar">
      <StepIndicator :current="step" :total="3" />
    </div>

    <div class="onboarding__content">
      <!-- Headline -->
      <div class="onboarding__headline">
        <h1 class="onboarding__title">{{ stepTitle[step - 1] }}</h1>
        <p class="onboarding__desc">{{ stepDescription[step - 1] }}</p>
      </div>

      <!-- Step 1: 유저 특성 정보 (복수 선택) -->
      <div v-if="step === 1" class="onboarding__body">
        <div class="option-grid">
          <button
            v-for="field in USER_INFO_FIELDS"
            :key="field.key"
            :class="['option-card', { 'option-card--selected': form[field.key] }]"
            @click="form[field.key] = !form[field.key]"
          >
            <span class="material-symbols-outlined option-card__icon">{{ field.icon }}</span>
            <span class="option-card__label">{{ field.label }}</span>
            <span v-if="form[field.key]" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
        <button :class="['none-btn', { 'none-btn--selected': noneSelected }]" @click="clearUserInfo">
          <span class="material-symbols-outlined" style="font-size: 20px;">check</span>
          해당 없음
        </button>
      </div>

      <!-- Step 2: 연령대 (단일 선택) -->
      <div v-if="step === 2" class="onboarding__body">
        <div class="option-grid">
          <button
            v-for="ag in AGE_GROUP_OPTIONS"
            :key="ag.code"
            :class="['option-card', { 'option-card--selected': form.ageGroupCode === ag.code }]"
            @click="form.ageGroupCode = ag.code"
          >
            <span class="option-card__label">{{ ag.label }}</span>
            <span v-if="form.ageGroupCode === ag.code" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
      </div>

      <!-- Step 3: 여행 스타일 (단일 선택) -->
      <div v-if="step === 3" class="onboarding__body">
        <div class="option-grid">
          <button
            v-for="ts in TRIP_STYLES"
            :key="ts.code"
            :class="['option-card', { 'option-card--selected': form.tripStyleCode === ts.code }]"
            @click="form.tripStyleCode = ts.code"
          >
            <span class="material-symbols-outlined option-card__icon">{{ ts.icon }}</span>
            <span class="option-card__label">{{ ts.label }}</span>
            <span v-if="form.tripStyleCode === ts.code" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sticky bottom -->
    <div class="onboarding__bottom">
      <div class="onboarding__actions">
        <BaseButton v-if="step > 1" variant="ghost" @click="step--">
          <span class="material-symbols-outlined">arrow_back</span>
        </BaseButton>
        <BaseButton v-if="step < 3" full-width :disabled="!canNext" @click="step++">
          다음 단계
          <span class="material-symbols-outlined">arrow_forward</span>
        </BaseButton>
        <BaseButton v-if="step === 3" full-width :loading="userStore.isLoading" @click="handleComplete">
          완료
          <span class="material-symbols-outlined">check</span>
        </BaseButton>
      </div>
      <div class="onboarding__skip">
        <button class="skip-link" @click="handleSkipNow">그냥 넘어가기</button>
        <span class="skip-divider">|</span>
        <button class="skip-link" @click="handleSkipWeek">일주일 간 보지 않기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import StepIndicator from '@/components/common/StepIndicator.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useUserStore } from '@/stores/userStore'
import { AGE_GROUP_OPTIONS, USER_INFO_FIELDS, TRIP_STYLES } from '@/constants/enums'

const router = useRouter()
const userStore = useUserStore()

const step = ref(1)
const form = reactive({
  // UserInfo booleans (Step 1)
  usesWheelchair: false,
  hasStroller: false,
  usesWalkingAid: false,
  hasServiceDog: false,
  needsVisualAssistance: false,
  // Age Group (Step 2)
  ageGroupCode: null,
  // Trip Style (Step 3)
  tripStyleCode: null,
})

const stepTitle = [
  '편한 여행을 위해\n알려주세요',
  '연령대를\n선택해주세요',
  '선호하는 여행 스타일을\n선택해주세요',
]
const stepDescription = [
  '해당하는 항목을 모두 선택해주세요. (복수 선택 가능)',
  '맞춤 여행 추천을 위해 알려주세요.',
  '관심 있는 여행 스타일을 골라주세요.',
]

const noneSelected = computed(() =>
  !form.usesWheelchair && !form.hasStroller && !form.usesWalkingAid && !form.hasServiceDog && !form.needsVisualAssistance
)

const canNext = computed(() => {
  if (step.value === 1) return true // Step 1은 선택 안 해도 넘어갈 수 있음 (해당 없음)
  if (step.value === 2) return form.ageGroupCode !== null
  return true
})

function clearUserInfo() {
  form.usesWheelchair = false
  form.hasStroller = false
  form.usesWalkingAid = false
  form.hasServiceDog = false
  form.needsVisualAssistance = false
}

async function handleComplete() {
  await userStore.updateMe({
    usesWheelchair: form.usesWheelchair,
    hasStroller: form.hasStroller,
    usesWalkingAid: form.usesWalkingAid,
    hasServiceDog: form.hasServiceDog,
    needsVisualAssistance: form.needsVisualAssistance,
    ageGroupCode: form.ageGroupCode,
    tripStyleCode: form.tripStyleCode,
  })
  router.push('/')
}

function handleSkipNow() {
  localStorage.setItem('skipOnboardingUntil', String(Date.now() + 86400000))
  router.push('/')
}

function handleSkipWeek() {
  localStorage.setItem('skipOnboardingUntil', String(Date.now() + 604800000))
  router.push('/')
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--color-surface);
}
.onboarding__step-bar { padding: 16px 20px 8px; }
.onboarding__content {
  flex: 1; display: flex; flex-direction: column;
  padding: 0 20px; max-width: 32rem; margin: 0 auto; width: 100%;
}

.onboarding__headline { margin: 24px 0; }
.onboarding__title {
  font-size: var(--font-size-2xl); font-weight: 800;
  color: var(--color-on-surface); line-height: 1.3;
  white-space: pre-line;
}
.onboarding__desc { font-size: var(--font-size-lg); color: var(--color-on-surface-variant); margin-top: 8px; }

.onboarding__body { flex: 1; }

.option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }

.option-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px 12px; min-height: 100px;
  border-radius: var(--radius-DEFAULT);
  background: var(--color-surface-container-low);
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

.option-card__icon { font-size: 32px; margin-bottom: 8px; }
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
.onboarding__actions { display: flex; gap: 12px; margin-bottom: 12px; }
.onboarding__skip { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 8px 0; }
.skip-link {
  font-size: var(--font-size-sm); color: var(--color-outline);
  background: none; border: none; cursor: pointer; font-weight: 500;
  transition: color 0.15s;
}
.skip-link:hover { color: var(--color-primary); }
.skip-divider { color: var(--color-outline-variant); }
</style>

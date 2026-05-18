<template>
  <DefaultLayout title="마이페이지" show-back>
    <!-- Profile Card -->
    <BaseCard padding="lg" elevated class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 28px; color: var(--color-on-primary);">person</span>
        </div>
        <div>
          <h2 class="profile-name">{{ authStore.nickname }}</h2>
          <p class="profile-id">@{{ authStore.user?.userName }}</p>
        </div>
      </div>
    </BaseCard>

    <!-- 기본 정보 수정 -->
    <h3 class="section-title">기본 정보</h3>
    <BaseCard padding="lg" elevated class="section-card">
      <BaseInput
        v-model="editForm.nickname"
        label="닉네임"
        placeholder="닉네임을 입력하세요"
      />
    </BaseCard>

    <!-- 접근성 정보 수정 -->
    <h3 class="section-title">접근성 정보</h3>
    <BaseCard padding="lg" elevated class="section-card">
      <div class="option-grid">
        <button
          v-for="field in USER_DETAIL_FIELDS"
          :key="field.key"
          :class="['option-card', { 'option-card--selected': editForm[field.key] }]"
          @click="editForm[field.key] = editForm[field.key] ? 0 : 1"
        >
          <span class="material-symbols-outlined option-card__icon">{{ field.icon }}</span>
          <span class="option-card__label">{{ field.label }}</span>
          <span v-if="editForm[field.key]" class="option-card__check material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
        </button>
      </div>
    </BaseCard>

    <!-- 표시 설정 -->
    <h3 class="section-title">표시 설정</h3>
    <BaseCard padding="lg" elevated class="section-card">
      <p class="setting-label">글자 크기</p>
      <input
        type="range" min="1.0" max="1.8" step="0.1"
        :value="themeStore.fontScale"
        class="font-slider"
        @input="themeStore.setFontScale(Number($event.target.value))"
      />
      <div class="font-scale-labels">
        <span style="font-size: 14px;">가</span>
        <span style="font-size: 18px;">가</span>
        <span style="font-size: 22px;">가</span>
      </div>
    </BaseCard>

    <!-- 액션 버튼 -->
    <div class="profile-actions">
      <BaseButton full-width :loading="isSaving" @click="handleSave">
        <span class="material-symbols-outlined">save</span>
        저장
      </BaseButton>
      <BaseButton full-width variant="ghost" @click="handleLogout">
        <span class="material-symbols-outlined">logout</span>
        로그아웃
      </BaseButton>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useToast } from '@/composables/useToast'
import { USER_DETAIL_FIELDS } from '@/constants/enums'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { showToast } = useToast()

const isSaving = ref(false)

const editForm = reactive({
  nickname: '',
  physical: 0,
  visual: 0,
  hearing: 0,
  infantFamily: 0,
})

// user 로딩 시 폼 동기화
watch(() => authStore.user, (u) => {
  if (u) {
    editForm.nickname = u.nickname || ''
    editForm.physical = u.physical || 0
    editForm.visual = u.visual || 0
    editForm.hearing = u.hearing || 0
    editForm.infantFamily = u.infantFamily || 0
  }
}, { immediate: true })

async function handleSave() {
  isSaving.value = true
  try {
    const payload = {
      userName: authStore.user?.userName,
      nickname: editForm.nickname,
      physical: editForm.physical,
      visual: editForm.visual,
      hearing: editForm.hearing,
      infant_family: editForm.infantFamily,
    }
    await authStore.updateMe(payload)
    // 닉네임 반영을 위해 로컬 user 갱신
    if (authStore.user) {
      authStore.user.nickname = editForm.nickname
      authStore.user.physical = editForm.physical
      authStore.user.visual = editForm.visual
      authStore.user.hearing = editForm.hearing
      authStore.user.infantFamily = editForm.infantFamily
    }

    showToast('정보가 저장되었습니다.', 'success')
  } catch (err) {
    showToast(err?.response?.data?.message || '저장 중 오류가 발생했습니다.', 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  showToast('로그아웃되었습니다.', 'info')
  router.push('/')
}
</script>

<style scoped>
.profile-card { margin-bottom: 24px; }
.profile-header { display: flex; align-items: center; gap: 16px; }
.profile-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-md); flex-shrink: 0;
}
.profile-name { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-on-surface); }
.profile-id { font-size: var(--font-size-sm); color: var(--color-outline); }

.section-title {
  font-size: var(--font-size-base); font-weight: 700;
  color: var(--color-on-surface-variant);
  margin-bottom: 12px; padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}
.section-card { margin-bottom: 24px; }

.option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

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
.option-card__icon { font-size: 32px; margin-bottom: 6px; }
.option-card__label { font-size: var(--font-size-sm); font-weight: 700; }
.option-card__check { position: absolute; top: 6px; right: 6px; font-size: 16px; }

.setting-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-on-surface); margin-bottom: 4px; }
.font-slider {
  width: 100%; height: 6px;
  accent-color: var(--color-primary);
  background: var(--color-surface-container);
  border-radius: 3px; cursor: pointer;
}
.font-scale-labels { display: flex; justify-content: space-between; margin-top: 4px; color: var(--color-outline); font-weight: 500; }

.profile-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
</style>

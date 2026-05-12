<template>
  <DefaultLayout title="마이페이지" show-back>
    <!-- Profile Card -->
    <BaseCard padding="lg" elevated class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size: 28px; color: var(--color-on-primary);">person</span>
        </div>
        <div>
          <h2 class="profile-name">{{ userStore.nickname }}</h2>
          <p class="profile-id">@{{ userStore.user?.userName }}</p>
        </div>
      </div>
    </BaseCard>

    <!-- 표시 설정 -->
    <h3 class="settings-title">표시 설정</h3>
    <BaseCard padding="lg" elevated class="settings-card">
      <!-- Simple Mode -->
      <div class="setting-row setting-row--border">
        <div>
          <p class="setting-label">간편 모드</p>
          <p class="setting-desc">큰 글씨, 큰 버튼</p>
        </div>
        <button :class="['toggle', { 'toggle--on': themeStore.isSimpleMode }]" role="switch" :aria-checked="themeStore.isSimpleMode" @click="toggleSimpleMode">
          <span class="toggle__thumb" />
        </button>
      </div>

      <!-- Font Scale -->
      <div class="setting-row setting-row--border">
        <div style="width: 100%;">
          <p class="setting-label">글자 크기</p>
          <input type="range" min="0.8" max="1.8" step="0.1" :value="themeStore.fontScale" class="font-slider" @input="themeStore.setFontScale(Number($event.target.value))" />
          <div class="font-scale-labels">
            <span style="font-size: 12px;">가</span>
            <span style="font-size: 16px;">가</span>
            <span style="font-size: 20px;">가</span>
          </div>
        </div>
      </div>

      <!-- High Contrast -->
      <div class="setting-row">
        <div>
          <p class="setting-label">고대비 모드</p>
          <p class="setting-desc">색상 대비 강화</p>
        </div>
        <button :class="['toggle', { 'toggle--on': themeStore.highContrast }]" role="switch" :aria-checked="themeStore.highContrast" @click="themeStore.toggleHighContrast()">
          <span class="toggle__thumb" />
        </button>
      </div>
    </BaseCard>

    <div class="profile-actions">
      <BaseButton full-width variant="outline" @click="$router.push('/onboarding')">프로필 다시 설정하기</BaseButton>
      <BaseButton full-width variant="ghost" @click="handleLogout">로그아웃</BaseButton>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

function toggleSimpleMode() {
  const newMode = themeStore.isSimpleMode ? 'standard' : 'simple'
  themeStore.setMode(newMode)
  userStore.updateMe({ uiMode: newMode === 'simple' ? 'SIMPLE' : 'STANDARD' })
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-card { margin-bottom: 24px; }
.profile-header { display: flex; align-items: center; gap: 16px; }
.profile-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-md);
}
.profile-name { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-on-surface); }
.profile-id { font-size: var(--font-size-sm); color: var(--color-outline); }

.settings-title {
  font-size: var(--font-size-base); font-weight: 700;
  color: var(--color-on-surface-variant);
  margin-bottom: 12px; padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}
.settings-card { margin-bottom: 24px; }

.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
.setting-row--border { border-bottom: 1px solid rgba(191,199,210,.15); margin-bottom: 8px; padding-bottom: 16px; }
.setting-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-on-surface); }
.setting-desc { font-size: var(--font-size-sm); color: var(--color-outline); margin-top: 2px; }

.toggle {
  position: relative; width: 52px; height: 28px; border-radius: 14px;
  background: var(--color-surface-container-high);
  border: none; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
}
.toggle--on { background: var(--color-primary); }
.toggle__thumb {
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}
.toggle--on .toggle__thumb { transform: translateX(24px); }

.font-slider {
  width: 100%; height: 6px; margin-top: 8px;
  accent-color: var(--color-primary);
  background: var(--color-surface-container);
  border-radius: 3px; cursor: pointer;
}
.font-scale-labels { display: flex; justify-content: space-between; margin-top: 4px; color: var(--color-outline); font-weight: 500; }

.profile-actions { display: flex; flex-direction: column; gap: 12px; }
</style>

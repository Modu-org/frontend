<template>
  <div class="min-h-screen w-full bg-[var(--color-surface)]">
    <AppHeader :title="title" :show-back="showBack" />
    <main class="w-full pb-[calc(var(--bottom-nav-height)+var(--space-lg))] md:pb-[var(--space-2xl)]">
      <!-- 전체 너비 슬롯 (배너, 히어로 이미지 등) -->
      <slot name="full-bleed" />

      <!-- 일반 콘텐츠: 모바일 px-4, 웹 md+ 200px 양측 패딩 -->
      <div
        v-if="$slots.default"
        :class="[
          noPadding ? 'px-0' : 'px-4 sm:px-8 md:px-[200px]',
          noPadding ? '' : 'pt-6 md:pt-8'
        ]"
      >
        <slot />
      </div>
    </main>
    <AppBottomNav />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppBottomNav from '@/components/common/AppBottomNav.vue'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false },
})
</script>

<template>
  <div class="min-h-screen w-full bg-[var(--color-surface)]">
    <AppHeader :title="title" :show-back="showBack" />
    <main class="w-full px-4 sm:px-6 lg:px-8 pb-[calc(var(--bottom-nav-height)+var(--space-lg))] md:pb-[var(--space-2xl)] pt-6 md:pt-8">
        <slot />
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
})
</script>

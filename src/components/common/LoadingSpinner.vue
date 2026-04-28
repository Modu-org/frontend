<template>
  <div class="flex items-center justify-center py-12" role="status" aria-label="로딩 중">
    <div class="relative w-12 h-12">
      <div class="absolute inset-0 rounded-full border-4 border-[var(--color-primary-fixed)] opacity-30" />
      <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-primary)] animate-spin" />
    </div>
    <span class="sr-only">로딩 중...</span>
  </div>
</template>

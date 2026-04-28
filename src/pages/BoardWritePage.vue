<template>
  <DefaultLayout title="게시글 작성" show-back>
    <div class="max-w-3xl mx-auto pb-10">
      <!-- 관광지 정보 (query로 전달된 경우) -->
      <div v-if="attractionName" class="bg-[var(--color-surface-container-low)] p-4 rounded-[var(--radius-lg)] ghost-border flex items-center gap-3 mb-6">
        <span class="material-symbols-outlined text-[var(--color-primary)] text-3xl">location_on</span>
        <div>
          <p class="text-xs text-[var(--color-on-surface-variant)] font-bold">선택된 여행지</p>
          <p class="text-base font-bold text-[var(--color-on-surface)]">{{ attractionName }}</p>
        </div>
      </div>

      <!-- 카테고리 -->
      <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border mb-6">
        <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-3">카테고리</label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="[
              'px-4 py-2 rounded-full text-sm font-bold transition-all duration-200',
              form.category === cat
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            ]"
            @click="form.category = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- 제목 / 내용 -->
      <div class="bg-[var(--color-surface-container-lowest)] p-6 rounded-[var(--radius-lg)] ghost-border space-y-5 mb-6">
        <div>
          <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-2">제목</label>
          <BaseInput v-model="form.title" placeholder="제목을 입력해주세요" />
        </div>
        <div>
          <label class="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-2">내용</label>
          <textarea
            v-model="form.content"
            class="w-full h-48 bg-[var(--color-surface-container-low)] rounded-[var(--radius-DEFAULT)] p-4 text-base text-[var(--color-on-surface)] outline-none resize-none transition-colors focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="상세한 내용을 작성해주세요"
          ></textarea>
        </div>
      </div>

      <!-- 등록 -->
      <BaseButton full-width size="lg" :disabled="!isValid" @click="handleSubmit">
        등록하기
        <span class="material-symbols-outlined">send</span>
      </BaseButton>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { MOCK_ATTRACTIONS } from '@/api/mock/mockData'

const route = useRoute()
const router = useRouter()

const categories = ['여행지 추천', '여행지 불편사항 제보', '건의사항', '기타']

const attractionName = ref('')

const form = ref({
  category: '기타',
  title: '',
  content: '',
})

onMounted(() => {
  if (route.query.attractionId) {
    const att = MOCK_ATTRACTIONS.find(item => item.attractionId === String(route.query.attractionId))
    if (att) attractionName.value = att.name
  }
  if (route.query.type === '제보') form.value.category = '여행지 불편사항 제보'
  else if (route.query.type === '추천') form.value.category = '여행지 추천'
})

const isValid = computed(() => form.value.category && form.value.title.trim() && form.value.content.trim())

function handleSubmit() {
  alert('게시글이 성공적으로 등록되었습니다. (MVP)')
  router.back()
}
</script>

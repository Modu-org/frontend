<template>
  <section class="ai-workflow" aria-label="AI 일정 도우미" :aria-busy="isBusy">
    <h2 class="ai-workflow__title">AI 일정 도우미</h2>
    <p class="ai-workflow__hint">변경 내용을 확인하고 저장을 눌러야 일정에 반영됩니다.</p>
    <form class="ai-workflow__form" @submit.prevent="submitCommand(text)">
      <label :for="inputId">요청할 내용</label>
      <textarea :id="inputId" v-model="text" maxlength="4000" rows="3" :disabled="isBusy || !!state.proposal"
        :placeholder="attractionId ? '예: 서울 여행 일정에 이 관광지를 추가해줘' : '예: 2027년 1월 10일부터 12일까지 제주 여행이라는 일정을 만들어줘'" />
      <BaseButton type="submit" :disabled="isBusy || !!state.proposal || !text.trim()">
        {{ state.status === 'planning' ? '변경안 만드는 중…' : '변경안 확인하기' }}
      </BaseButton>
    </form>
    <p v-if="state.message" class="ai-workflow__message" role="status">{{ state.message }}</p>
    <p v-if="state.error" class="ai-workflow__error" role="alert">{{ state.error }}</p>
    <div v-if="state.proposal" class="ai-workflow__review" aria-label="저장 전 변경 내용">
      <h3>이대로 저장할까요?</h3>
      <ol>
        <li v-for="(change, index) in state.proposal.changes" :key="index">
          <strong>{{ change.operation === 'CREATE_SCHEDULE' ? '새 일정 생성' : '관광지 추가' }}</strong>
          <p>일정: {{ change.title }}</p>
          <p>여행 기간: {{ change.startDate }} ~ {{ change.endDate }}</p>
          <p v-if="change.operation === 'ADD_ATTRACTION'">추가할 관광지: {{ change.attractionName }} · 미배치 장소로 추가</p>
        </li>
      </ol>
      <p class="ai-workflow__hint">확인 가능 시간: {{ expiryLabel }}까지</p>
      <div class="ai-workflow__actions">
        <BaseButton variant="ghost" :disabled="isBusy" @click="cancel">취소</BaseButton>
        <BaseButton :disabled="isBusy" @click="save">{{ state.status === 'confirming' ? '저장 중…' : '확인하고 저장' }}</BaseButton>
      </div>
    </div>
    <RouterLink v-if="state.schedule" :to="`/schedule/${state.schedule.scheduleId}`">저장한 일정 보기</RouterLink>
  </section>
</template>

<script setup>
import { computed, ref, useId } from 'vue'
import BaseButton from './BaseButton.vue'
import { scheduleApi } from '@/api/scheduleApi'
import { createAiScheduleWorkflow } from '@/services/aiScheduleWorkflow'

const props = defineProps({ attractionId: { type: [Number, String], default: null } })
const emit = defineEmits(['saved'])
const inputId = `ai-command-${useId()}`
const text = ref('')
const { state, plan, confirm, cancel } = createAiScheduleWorkflow(scheduleApi)
const isBusy = computed(() => ['planning', 'confirming', 'cancelling'].includes(state.status))
const expiryLabel = computed(() => new Date(state.proposal?.expiresAt).toLocaleTimeString('ko-KR'))

async function submitCommand(command) {
  if (isBusy.value || state.proposal) return
  text.value = command
  await plan(command, props.attractionId == null ? null : Number(props.attractionId))
}
async function save() {
  const result = await confirm()
  if (result) emit('saved', result.schedule)
}
defineExpose({ submitCommand })
</script>

<style scoped>
.ai-workflow { padding: 20px; margin: 16px 0; border: 1px solid var(--color-outline-variant); border-radius: var(--radius-lg); background: var(--color-surface-container-lowest); }
.ai-workflow__title { font-size: var(--font-size-lg); font-weight: 800; margin-bottom: 8px; }
.ai-workflow__hint { color: var(--color-on-surface-variant); line-height: 1.6; margin: 8px 0; }
.ai-workflow__form { display: grid; gap: 10px; margin-top: 12px; }
textarea { width: 100%; padding: 12px; border: 1px solid var(--color-outline); border-radius: 8px; font: inherit; resize: vertical; box-sizing: border-box; color: var(--color-on-surface); background: var(--color-surface-container-lowest); }
textarea:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.ai-workflow__message { margin-top: 12px; line-height: 1.6; white-space: pre-line; }
.ai-workflow__error { margin-top: 12px; color: var(--color-error); }
.ai-workflow__review { margin-top: 16px; padding: 16px; border: 2px solid var(--color-primary); border-radius: 12px; }
.ai-workflow__review h3 { font-weight: 800; }
.ai-workflow__review ol { padding-left: 20px; }
.ai-workflow__review li { margin-top: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.ai-workflow__actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap; }
</style>

<template>
  <DefaultLayout title="내 여행">
    <!-- 새 스케줄 생성 -->
    <BaseCard padding="md" class="mb-6">
      <h2 class="section-title">
        <span class="material-symbols-outlined">add_circle</span>
        새 여행 계획
      </h2>
      <form class="schedule-form" @submit.prevent="createNewSchedule">
        <BaseInput v-model="newTitle" placeholder="여행 계획 이름 (예: 제주 2박3일)" />
        <div class="schedule-form__row">
          <BaseInput v-model="newRegion" placeholder="지역" />
          <BaseInput v-model="newStartDate" type="date" label="시작일" />
          <BaseInput v-model="newEndDate" type="date" label="종료일" />
        </div>
        <div class="schedule-form__row">
          <BaseInput v-model.number="newPeopleCount" type="number" label="인원" min="1" />
          <BaseInput v-model.number="newBudget" type="number" label="예산 (원)" min="0" />
        </div>
        <BaseButton type="submit" :disabled="!newTitle.trim()" full-width>만들기</BaseButton>
      </form>
    </BaseCard>

    <!-- 스케줄 목록 -->
    <h2 class="section-title mb-4">
      <span class="material-symbols-outlined">calendar_month</span>
      내 여행 일정
      <span class="section-count">({{ scheduleStore.totalSchedules }})</span>
    </h2>

    <LoadingSpinner v-if="scheduleStore.isLoading" />

    <div v-else-if="scheduleStore.schedules.length" class="schedule-list">
      <BaseCard v-for="s in scheduleStore.schedules" :key="s.scheduleId" padding="md" hoverable clickable @click="goToSchedule(s)">
        <div class="schedule-item">
          <div class="schedule-item__main">
            <h3 class="schedule-item__title">{{ s.title }}</h3>
            <p class="schedule-item__meta">{{ s.region || '지역 미정' }} · {{ formatDateRange(s.startDate, s.endDate) }}</p>
            <p class="schedule-item__sub">{{ s.peopleCount }}명 · 예산 {{ (s.budget || 0).toLocaleString() }}원</p>
          </div>
          <div class="schedule-item__actions">
            <button class="icon-btn" @click.stop="openEdit(s)"><span class="material-symbols-outlined">edit</span></button>
            <button class="icon-btn icon-btn--danger" @click.stop="confirmDelete(s)"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </div>
        <div class="schedule-item__footer">
          <span><span class="material-symbols-outlined" style="font-size:16px;">location_on</span> {{ s.nodeCount || 0 }}개 장소</span>
        </div>
      </BaseCard>
    </div>

    <div v-else class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">luggage</span>
      <p>아직 만든 여행이 없습니다.</p>
      <p class="empty-state__sub">위에서 새 여행 계획을 만들어보세요!</p>
    </div>

    <!-- Edit Dialog -->
    <BaseModal v-model="showEditModal" title="여행 일정 수정">
      <div class="edit-form">
        <BaseInput v-model="editForm.title" label="이름" />
        <BaseInput v-model="editForm.region" label="지역" />
        <BaseInput v-model="editForm.startDate" type="date" label="시작일" />
        <BaseInput v-model="editForm.endDate" type="date" label="종료일" />
        <BaseInput v-model.number="editForm.peopleCount" type="number" label="인원" min="1" />
        <BaseInput v-model.number="editForm.budget" type="number" label="예산 (원)" />
      </div>
      <template #footer>
        <div class="edit-actions">
          <BaseButton variant="ghost" @click="showEditModal = false">취소</BaseButton>
          <BaseButton @click="saveEdit">저장</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirm Dialog -->
    <BaseDialog
      v-model="showDeleteDialog"
      title="여행 삭제"
      :message="`'${deleteTarget?.title}' 여행 계획을 삭제하시겠습니까?`"
      confirm-text="삭제"
      confirm-variant="danger"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useScheduleStore } from '@/stores/scheduleStore'

const router = useRouter()
const scheduleStore = useScheduleStore()

// Create form
const newTitle = ref('')
const newRegion = ref('')
const newStartDate = ref('')
const newEndDate = ref('')
const newPeopleCount = ref(1)
const newBudget = ref(0)

// Edit
const showEditModal = ref(false)
const editingId = ref(null)
const editForm = reactive({ title: '', region: '', startDate: '', endDate: '', peopleCount: 1, budget: 0 })

// Delete
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

onMounted(() => scheduleStore.fetchSchedules())

async function createNewSchedule() {
  if (!newTitle.value.trim()) return
  const schedule = await scheduleStore.createSchedule({
    title: newTitle.value.trim(),
    region: newRegion.value,
    startDate: newStartDate.value || new Date().toISOString().slice(0, 10),
    endDate: newEndDate.value || new Date().toISOString().slice(0, 10),
    peopleCount: newPeopleCount.value,
    budget: newBudget.value,
  })
  newTitle.value = ''
  newRegion.value = ''
  newStartDate.value = ''
  newEndDate.value = ''
  newPeopleCount.value = 1
  newBudget.value = 0
  router.push(`/schedule/${schedule.scheduleId}`)
}

function goToSchedule(s) {
  router.push(`/schedule/${s.scheduleId}`)
}

function openEdit(s) {
  editingId.value = s.scheduleId
  Object.assign(editForm, { title: s.title, region: s.region, startDate: s.startDate, endDate: s.endDate, peopleCount: s.peopleCount, budget: s.budget })
  showEditModal.value = true
}

async function saveEdit() {
  await scheduleStore.updateSchedule(editingId.value, { ...editForm })
  showEditModal.value = false
}

function confirmDelete(s) {
  deleteTarget.value = s
  showDeleteDialog.value = true
}

async function doDelete() {
  if (deleteTarget.value) await scheduleStore.deleteSchedule(deleteTarget.value.scheduleId)
  deleteTarget.value = null
}

function formatDateRange(start, end) {
  if (!start) return '날짜 미정'
  const s = new Date(start)
  const e = end ? new Date(end) : s
  const diff = Math.ceil((e - s) / 86400000)
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`
  return diff > 0 ? `${fmt(s)} ~ ${fmt(e)} (${diff}박)` : fmt(s)
}
</script>

<style scoped>
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface);
}
.section-title .material-symbols-outlined { color: var(--color-primary); }
.section-count { font-size: var(--font-size-sm); font-weight: 400; color: var(--color-outline); }

.schedule-form { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.schedule-form__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }

.schedule-list { display: flex; flex-direction: column; gap: 12px; }

.schedule-item { display: flex; align-items: flex-start; justify-content: space-between; }
.schedule-item__main { flex: 1; min-width: 0; }
.schedule-item__title { font-size: var(--font-size-base); font-weight: 700; color: var(--color-on-surface); }
.schedule-item__meta { font-size: var(--font-size-sm); color: var(--color-outline); margin-top: 4px; }
.schedule-item__sub { font-size: var(--font-size-xs); color: var(--color-outline); margin-top: 2px; }
.schedule-item__actions { display: flex; gap: 4px; flex-shrink: 0; }
.schedule-item__footer {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid rgba(191,199,210,.15);
  font-size: var(--font-size-xs); color: var(--color-outline);
  display: flex; align-items: center; gap: 12px;
}

.icon-btn {
  padding: 8px; border-radius: 50%; border: none; background: none; cursor: pointer;
  color: var(--color-outline); transition: background 0.15s;
}
.icon-btn:hover { background: var(--color-surface-container); }
.icon-btn--danger:hover { background: rgba(186,26,26,.08); color: var(--color-error); }

.empty-state { text-align: center; padding: 48px 0; color: var(--color-outline); }
.empty-state__icon { font-size: 56px; color: var(--color-outline-variant); margin-bottom: 12px; }
.empty-state__sub { font-size: var(--font-size-sm); margin-top: 4px; }

.edit-form { display: flex; flex-direction: column; gap: 12px; }
.edit-actions { display: flex; gap: 12px; justify-content: flex-end; }

.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
</style>

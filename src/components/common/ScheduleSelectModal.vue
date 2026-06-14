<template>
  <Teleport to="body">
    <div v-if="visible && !isSavedSuccess" class="modal-backdrop" @click.self="close">
      <div class="modal-sheet">
        <!-- 헤더 -->
        <div class="modal-header">
          <button class="modal-close" @click="close" aria-label="닫기">
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 class="modal-title">일정에 추가</h2>
          <div class="modal-subtitle">{{ attractionName }}</div>
        </div>

        <div class="modal-body">
          <!-- 기존 일정 목록 -->
          <section v-if="schedules.length" class="sched-section">
            <h3 class="sched-label">내 일정 목록</h3>
            <p class="sched-hint">관광지를 추가할 일정을 선택하세요.</p>
            <ul class="sched-list">
              <li
                v-for="s in schedules"
                :key="s.scheduleId"
                :class="['sched-item', { 'sched-item--selected': selectedId === s.scheduleId }]"
                @click="selectedId = s.scheduleId; mode = 'existing'"
              >
                <span class="sched-item__radio">
                  <span v-if="selectedId === s.scheduleId" class="material-symbols-outlined" style="font-size:1rem;color:var(--color-primary);">check_circle</span>
                  <span v-else class="material-symbols-outlined" style="font-size:1rem;color:var(--color-outline);">radio_button_unchecked</span>
                </span>
                <div class="sched-item__info">
                  <span class="sched-item__title">{{ s.title }}</span>
                  <span class="sched-item__date">{{ s.startDate }} ~ {{ s.endDate }}</span>
                </div>
                <span class="sched-item__count">{{ s.nodeCount ?? 0 }}곳</span>
              </li>
            </ul>
          </section>
          <div v-else-if="!isListLoading" class="sched-empty">등록된 일정이 없습니다.</div>

          <!-- 구분선 -->
          <div class="sched-divider">
            <span>또는</span>
          </div>

          <!-- 새 일정 추가 -->
          <section class="sched-section">
            <h3 class="sched-label">새 일정 추가</h3>
            <p class="sched-hint">새로 추가할 일정 정보를 입력해주세요.</p>

            <div class="form-row">
              <label class="form-label">일정 제목</label>
              <input
                v-model="newForm.title"
                class="form-input"
                placeholder="일정 이름을 입력하세요"
                @focus="mode = 'new'"
              />
            </div>

            <div class="form-row">
              <label class="form-label">여행 기간</label>
              <div class="date-row">
                <!-- 시작일 -->
                <div class="date-field" @click="toggleCal">
                  <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-primary);">calendar_month</span>
                  <span :class="['date-value', { 'date-value--placeholder': !newForm.startDate && !newForm.endDate }]">
                    {{ newForm.startDate || '시작일' }} ~ {{ newForm.endDate || '종료일' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 인라인 기간 선택 캘린더 -->
            <div v-if="showCal" class="calendar-inline" @click.stop>
              <div class="calendar-header">
                <button type="button" class="calendar-nav-btn" @click="calPrevMonth">
                  <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <span class="calendar-title">{{ calYear }}년 {{ calMonth + 1 }}월</span>
                <button type="button" class="calendar-nav-btn" @click="calNextMonth">
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div class="calendar-grid-weekdays">
                <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d" class="weekday">{{ d }}</span>
              </div>
              <div class="calendar-grid-days">
                <button type="button" v-for="day in calDays" :key="day.dateString"
                  :class="['day-btn', {
                    'day-btn--current': day.isCurrentMonth,
                    'day-btn--outside': !day.isCurrentMonth,
                    'day-btn--selected': day.dateString === newForm.startDate || day.dateString === newForm.endDate,
                    'day-btn--in-range': isInRange(day.dateString),
                    'day-btn--start-cap': day.dateString === newForm.startDate,
                    'day-btn--end-cap': day.dateString === newForm.endDate,
                  }]"
                  @click="selectDate(day.dateString)"
                >{{ day.dayNum }}</button>
              </div>
            </div>
          </section>
        </div>

        <!-- 하단 버튼 -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-save" :disabled="isSaving" @click="handleSave">
            <span v-if="isSaving" class="material-symbols-outlined" style="animation:spin .8s linear infinite;font-size:1.1rem;">progress_activity</span>
            <span v-else>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 일정 상세 이동 확인 -->
    <BaseDialog
      v-model="showConfirmDialog"
      title="일정 상세 이동"
      message="관광지가 일정에 추가되었습니다. 일정 상세 페이지로 이동하시겠습니까?"
      confirm-text="이동"
      cancel-text="아니오"
      @confirm="goToScheduleDetail"
      @cancel="handleSavedWithoutMoving"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { scheduleApi } from '@/api/scheduleApi'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: Boolean,
  attractionId: { type: [Number, String], default: null },
  attractionName: { type: String, default: '' },
})
const emit = defineEmits(['close', 'saved'])

const router = useRouter()
const { showToast } = useToast()

const schedules = ref([])
const isListLoading = ref(false)
const selectedId = ref(null)
const mode = ref('existing') // 'existing' | 'new'
const isSaving = ref(false)

const showConfirmDialog = ref(false)
const savedScheduleId = ref(null)
const isSavedSuccess = ref(false)

const newForm = ref({ title: '', startDate: '', endDate: '' })

// 캘린더 상태
const showCal = ref(false)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())

function toggleCal() {
  mode.value = 'new'
  showCal.value = !showCal.value
}

function calPrevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- } else calMonth.value--
}
function calNextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ } else calMonth.value++
}

function formatDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const calDays = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevTotal = new Date(year, month, 0).getDate()
  const days = []
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevTotal - i)
    days.push({ dayNum: prevTotal - i, isCurrentMonth: false, dateString: formatDateString(d) })
  }
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    days.push({ dayNum: i, isCurrentMonth: true, dateString: formatDateString(d) })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ dayNum: i, isCurrentMonth: false, dateString: formatDateString(d) })
  }
  return days
})

function selectDate(dateString) {
  if (!newForm.value.startDate || (newForm.value.startDate && newForm.value.endDate)) {
    newForm.value.startDate = dateString
    newForm.value.endDate = ''
  } else {
    if (dateString < newForm.value.startDate) {
      newForm.value.startDate = dateString
    } else {
      newForm.value.endDate = dateString
    }
  }
}

function isInRange(dateString) {
  const { startDate, endDate } = newForm.value
  if (!startDate || !endDate) return false
  return dateString > startDate && dateString < endDate
}

// 스케줄 로드
async function loadSchedules() {
  isListLoading.value = true
  try {
    const { data: res } = await scheduleApi.getAll()
    schedules.value = res.data || []
    if (schedules.value.length) { selectedId.value = schedules.value[0].scheduleId; mode.value = 'existing' }
  } catch { schedules.value = [] } finally { isListLoading.value = false }
}

// 다이얼로그 열림/닫힘 시 body 스크롤 잠금
watch(() => props.visible, v => {
  if (v) {
    document.body.style.overflow = 'hidden'
    loadSchedules()
    newForm.value = { title: '', startDate: '', endDate: '' }
    showCal.value = false
    mode.value = 'existing'
    isSavedSuccess.value = false
    calYear.value = new Date().getFullYear()
    calMonth.value = new Date().getMonth()
  } else {
    document.body.style.overflow = ''
  }
})

async function handleSave() {
  isSaving.value = true
  try {
    let scheduleId

    if (mode.value === 'existing' && selectedId.value) {
      scheduleId = selectedId.value
    } else {
      // 새 일정 생성
      if (!newForm.value.title.trim()) { showToast('일정 제목을 입력해주세요.', 'error'); return }
      if (!newForm.value.startDate || !newForm.value.endDate) { showToast('여행 기간을 선택해주세요.', 'error'); return }
      const { data: res } = await scheduleApi.create({
        title: newForm.value.title.trim(),
        startDate: newForm.value.startDate,
        endDate: newForm.value.endDate,
      })
      scheduleId = res.data.scheduleId
    }

    // 관광지를 노드로 추가
    if (props.attractionId) {
      await scheduleApi.addNode(scheduleId, { attractionId: Number(props.attractionId) })
    }

    showToast('일정에 추가되었습니다!', 'success')
    emit('saved', scheduleId)
    savedScheduleId.value = scheduleId
    isSavedSuccess.value = true
    showConfirmDialog.value = true
  } catch (err) {
    const msg = err?.response?.data?.message || '저장에 실패했습니다.'
    showToast(msg, 'error')
  } finally { isSaving.value = false }
}

function goToScheduleDetail() {
  close()
  router.push(`/schedule/${savedScheduleId.value}`)
}

function handleSavedWithoutMoving() {
  close()
}

function close() {
  document.body.style.overflow = ''
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
}
@media (min-width: 768px) {
  .modal-backdrop { align-items: center; }
}

.modal-sheet {
  width: 100%; max-width: 480px; max-height: 90vh;
  background: var(--color-surface); border-radius: 1.25rem 1.25rem 0 0;
  display: flex; flex-direction: column; overflow: hidden;
}
@media (min-width: 768px) {
  .modal-sheet { border-radius: 1.25rem; }
}

.modal-header {
  padding: 1.25rem 1.25rem 0.75rem;
  border-bottom: 1px solid var(--color-outline-variant);
  position: relative;
}
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; cursor: pointer;
  color: var(--color-on-surface-variant); font-size: 1.25rem; line-height: 1;
}
.modal-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface); margin-bottom: 0.2rem; }
.modal-subtitle { font-size: var(--font-size-sm); color: var(--color-primary-deep); font-weight: 600; }

.modal-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }

.sched-section { display: flex; flex-direction: column; gap: 0.5rem; }
.sched-label { font-size: var(--font-size-body); font-weight: 700; color: var(--color-on-surface); }
.sched-hint { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); margin-top: -0.25rem; }

.sched-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sched-item {
  display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 0.875rem;
  border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest); cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.sched-item--selected { border-color: var(--color-primary); background: var(--color-primary-soft); }
.sched-item__info { flex: 1; min-width: 0; }
.sched-item__title { display: block; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sched-item__date { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.sched-item__count { font-size: var(--font-size-xs); color: var(--color-primary-deep); font-weight: 700; flex-shrink: 0; }
.sched-empty { text-align: center; padding: 1rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

.sched-divider {
  display: flex; align-items: center; gap: 0.75rem; color: var(--color-outline);
  font-size: var(--font-size-xs); font-weight: 600;
}
.sched-divider::before, .sched-divider::after { content: ''; flex: 1; height: 1px; background: var(--color-outline-variant); }

/* 폼 */
.form-row { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-on-surface); }
.form-input {
  padding: 0.625rem 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant); background: #fff;
  font-size: var(--font-size-sm); color: var(--color-on-surface); font-family: inherit; outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: var(--color-primary); }

.date-row { display: flex; align-items: center; gap: 0.5rem; }
.date-field {
  flex: 1; display: flex; align-items: center; gap: 0.375rem;
  padding: 0.625rem 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant); cursor: pointer;
  background: #fff; transition: border-color 0.15s;
}
.date-field:hover { border-color: var(--color-primary); }
.date-value { font-size: var(--font-size-sm); color: var(--color-on-surface); }
.date-value--placeholder { color: var(--color-outline); }

/* 인라인 캘린더 */
.calendar-inline {
  background: rgba(255, 255, 255, 0.98);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem;
  box-sizing: border-box;
}

.calendar-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem;
}
.calendar-title { font-size: var(--font-size-sm); font-weight: 800; color: var(--color-on-surface); }
.calendar-nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; background: transparent;
  border-radius: 50%; cursor: pointer; color: var(--color-on-surface-variant); transition: background 0.15s;
}
.calendar-nav-btn:hover { background: var(--color-surface-container-high); color: var(--color-primary); }

.calendar-grid-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; font-size: var(--font-size-xs); font-weight: 700;
  color: var(--color-outline); margin-bottom: 0.5rem;
}

.calendar-grid-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

.day-btn {
  aspect-ratio: 1; border: none; background: transparent;
  font-size: var(--font-size-xs); font-weight: 600; color: var(--color-on-surface);
  border-radius: var(--radius-sm); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.day-btn--current { color: var(--color-on-surface); }
.day-btn--outside { color: var(--color-outline-variant); }
.day-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }

.day-btn--in-range {
  background: var(--color-primary-soft) !important;
  color: var(--color-primary-deep); border-radius: 0;
}
.day-btn--selected {
  background: var(--color-primary) !important;
  color: var(--color-on-primary) !important; font-weight: 700;
}
.day-btn--start-cap { border-top-left-radius: 50%; border-bottom-left-radius: 50%; }
.day-btn--end-cap { border-top-right-radius: 50%; border-bottom-right-radius: 50%; }

/* 하단 */
.modal-footer {
  padding: 1rem 1.25rem; border-top: 1px solid var(--color-outline-variant);
  display: flex; gap: 0.625rem;
}
.btn-cancel {
  flex: 1; padding: 0.75rem; border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant);
  background: none; color: var(--color-on-surface-variant); font-size: var(--font-size-body); font-weight: 600; cursor: pointer;
}
.btn-save {
  flex: 2; padding: 0.75rem; border-radius: var(--radius-DEFAULT); border: none;
  background: var(--color-primary); color: var(--color-on-primary);
  font-size: var(--font-size-body); font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.25rem;
  transition: opacity 0.15s;
}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>

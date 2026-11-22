<template>
  <DefaultLayout title="내 여행">
    <div v-if="isLoading" class="state-wrap"><LoadingSpinner /></div>

    <template v-else>
      <!-- 검색 필터 -->
      <section class="filter-section">
        <input v-model="filterTitle" class="filter-input" placeholder="일정 이름 검색..." />
        <div class="date-row">
          <div class="date-field-wrap">
            <div class="date-field" @click.stop="showFilterCal = !showFilterCal">
              <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-primary);">calendar_month</span>
              <span :class="['date-value', { 'date-value--placeholder': !filterStart && !filterEnd }]">
                {{ filterStart || '시작일' }} ~ {{ filterEnd || '종료일' }}
              </span>
            </div>
            <!-- 기간 선택 캘린더 (하나의 팝업) -->
            <div v-if="showFilterCal" class="filter-cal-popup" @click.stop>
              <div class="calendar-header">
                <button type="button" class="calendar-nav-btn" @click="filterCalPrevMonth"><span class="material-symbols-outlined">chevron_left</span></button>
                <span class="calendar-title">{{ filterCalYear }}년 {{ filterCalMonth + 1 }}월</span>
                <button type="button" class="calendar-nav-btn" @click="filterCalNextMonth"><span class="material-symbols-outlined">chevron_right</span></button>
              </div>
              <div class="calendar-grid-weekdays">
                <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d" class="weekday">{{ d }}</span>
              </div>
              <div class="calendar-grid-days">
                <button type="button" v-for="day in filterCalDays" :key="day.dateString"
                  :class="['day-btn', {
                    'day-btn--current': day.isCurrentMonth,
                    'day-btn--outside': !day.isCurrentMonth,
                    'day-btn--selected': day.dateString === filterStart || day.dateString === filterEnd,
                    'day-btn--in-range': isFilterInRange(day.dateString),
                    'day-btn--start-cap': day.dateString === filterStart,
                    'day-btn--end-cap': day.dateString === filterEnd,
                  }]"
                  @click="selectFilterDate(day.dateString)"
                >{{ day.dayNum }}</button>
              </div>
            </div>
          </div>
          <button v-if="filterTitle || filterStart || filterEnd" class="filter-reset-btn" @click="clearFilter">초기화</button>
        </div>
      </section>

      <!-- 내 일정 목록 -->
      <section v-if="filteredSchedules.length" class="list-section">
        <div class="list-header">
          <h2 class="section-title">내 일정 목록</h2>
          <BaseButton size="sm" @click="showNewDialog = true">
            <span class="material-symbols-outlined" style="font-size:1rem;">add</span>
            새 일정 추가
          </BaseButton>
        </div>
        <p class="section-hint">관광지를 추가할 일정을 선택하세요.</p>
        <ul class="schedule-list">
          <li
            v-for="s in filteredSchedules"
            :key="s.scheduleId"
            class="schedule-card"
            @click="goToSchedule(s.scheduleId)"
          >
            <div class="schedule-card__info">
              <span class="schedule-card__title">{{ s.title }}</span>
              <span class="schedule-card__date">{{ s.startDate }} ~ {{ s.endDate }}</span>
            </div>
            <div class="schedule-card__right">
              <span class="schedule-card__count">{{ s.nodeCount ?? 0 }}곳</span>
              <span class="material-symbols-outlined" style="color:var(--color-outline);font-size:1.25rem;">chevron_right</span>
            </div>
          </li>
        </ul>
      </section>
      <div v-else class="state-wrap">
        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-outline);">map</span>
        <p class="empty-text">{{ schedules.length ? '검색 결과가 없습니다.' : '등록된 일정이 없습니다.' }}</p>
        <p class="empty-sub">새 일정을 추가해보세요.</p>
        <BaseButton @click="showNewDialog = true">
          <span class="material-symbols-outlined" style="font-size:1rem;">add</span>
          새 일정 추가
        </BaseButton>
      </div>
    </template>

    <!-- 새 일정 추가 다이얼로그 -->
    <div v-if="showNewDialog" class="dialog-overlay" @click.self="closeNewDialog">
      <div class="dialog-panel" @click.stop>
        <!-- 헤더 -->
        <div class="dialog-panel__header">
          <h3>새 일정 추가</h3>
          <button class="dialog-close-btn" @click="closeNewDialog">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- 스크롤 가능한 본문 -->
        <div class="dialog-panel__body">
          <p class="dialog-hint">새로 추가할 일정 정보를 입력해주세요.</p>

          <div class="form-row">
            <label class="form-label">일정 제목</label>
            <input v-model="form.title" class="form-input" placeholder="일정 이름을 입력하세요" />
          </div>

          <div class="form-row">
            <label class="form-label">여행 기간</label>
            <div class="date-row">
              <div class="date-field" @click.stop="showCalendar = !showCalendar">
                <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-primary);">calendar_month</span>
                <span :class="['date-value', { 'date-value--placeholder': !form.startDate && !form.endDate }]">
                  {{ form.startDate || '시작일' }} ~ {{ form.endDate || '종료일' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 인라인 기간 선택 캘린더 -->
          <div v-if="showCalendar" class="calendar-inline" @click.stop>
            <div class="calendar-header">
              <button type="button" class="calendar-nav-btn" @click="prevMonth">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <span class="calendar-title">{{ calendarYear }}년 {{ calendarMonth + 1 }}월</span>
              <button type="button" class="calendar-nav-btn" @click="nextMonth">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div class="calendar-grid-weekdays">
              <span v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day" class="weekday">{{ day }}</span>
            </div>
            <div class="calendar-grid-days">
              <button type="button" v-for="day in calendarDays" :key="day.dateString"
                :class="['day-btn', {
                  'day-btn--current': day.isCurrentMonth,
                  'day-btn--outside': !day.isCurrentMonth,
                  'day-btn--selected': day.dateString === form.startDate || day.dateString === form.endDate,
                  'day-btn--in-range': isDateInRange(day.dateString),
                  'day-btn--start-cap': day.dateString === form.startDate,
                  'day-btn--end-cap': day.dateString === form.endDate,
                }]"
                @click="selectCalendarDate(day.dateString)"
              >{{ day.dayNum }}</button>
            </div>
          </div>

          <!-- 보호자 도착 알림 -->
          <div class="form-row">
            <label class="arrival-share-check">
              <input type="checkbox" v-model="form.arrivalShared" />
              <span class="arrival-share-check__label">
                <span class="material-symbols-outlined" style="font-size:1.1rem;">share_location</span>
                보호자에게 도착 알림 공유
              </span>
            </label>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="dialog-panel__footer">
          <button class="btn-cancel" @click="closeNewDialog">취소</button>
          <button class="btn-save" :disabled="isSaving" @click="createSchedule">
            <span v-if="isSaving" class="material-symbols-outlined" style="animation:spin .8s linear infinite;font-size:1.1rem;">progress_activity</span>
            <span v-else>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 음성 FAB -->
    <button
      :class="['voice-fab', { 'voice-fab--active': isListening }]"
      aria-label="음성으로 일정 선택"
      @click="handleVoice"
    >
      <span class="material-symbols-outlined" style="font-size:1.75rem;">{{ isListening ? 'mic_off' : 'mic' }}</span>
    </button>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { scheduleApi } from '@/api/scheduleApi'
import { useToast } from '@/composables/useToast'
import { useVoiceSearch } from '@/composables/useVoiceSearch'

const router = useRouter()
const { showToast } = useToast()
const voiceSearch = useVoiceSearch()

const schedules = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const filterCalTarget = ref(null)
const isListening = ref(false)
const showNewDialog = ref(false)
const showFilterCal = ref(false)

// 다이얼로그 열림 시 body 스크롤 잠금
watch(showNewDialog, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

const form = ref({ title: '', startDate: '', endDate: '', arrivalShared: false })

// 새 일정 추가 커스텀 캘린더 팝업 상태
const showCalendar = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth()) // 0 ~ 11

// 검색 필터
const filterTitle = ref('')
const filterStart = ref('')
const filterEnd = ref('')

const filteredSchedules = computed(() => {
  return schedules.value.filter((s) => {
    // 이름 필터
    if (filterTitle.value && !s.title.includes(filterTitle.value)) return false
    // 날짜 범위 필터: 검색 기간이 여행 기간 내에 포함되기만 하면 됨
    if (filterStart.value && s.endDate < filterStart.value) return false
    if (filterEnd.value && s.startDate > filterEnd.value) return false
    return true
  })
})

onMounted(() => {
  loadSchedules()
  window.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(e) {
  // 새 일정 캘린더 닫기
  const picker = document.querySelector('.calendar-popup')
  const trigger = document.querySelector('.info-bar__date-btn')
  if (picker && !picker.contains(e.target) && trigger && !trigger.contains(e.target)) {
    showCalendar.value = false
  }
  // 검색 필터 캘린더 닫기
  const filterPop = document.querySelector('.filter-cal-popup')
  const filterField = document.querySelector('.date-field')
  if (showFilterCal.value && filterPop && !filterPop.contains(e.target) && filterField && !filterField.contains(e.target)) {
    showFilterCal.value = false
  }
}

async function loadSchedules() {
  isLoading.value = true
  try {
    const { data: res } = await scheduleApi.getAll()
    schedules.value = Array.isArray(res.data) ? res.data : (res.data?.content ?? [])
  } catch { schedules.value = [] } finally { isLoading.value = false }
}

function goToSchedule(id) { router.push(`/schedule/${id}`) }

// 검색 캘린더 기간 선택 (시작일 → 종료일 순서)
function selectFilterDate(dateString) {
  if (!filterStart.value || (filterStart.value && filterEnd.value)) {
    // 시작일 선택 (or 재선택)
    filterStart.value = dateString
    filterEnd.value = ''
  } else {
    // 종료일 선택
    if (dateString < filterStart.value) {
      filterStart.value = dateString
    } else {
      filterEnd.value = dateString
      showFilterCal.value = false
    }
  }
}

function isFilterInRange(dateString) {
  if (!filterStart.value || !filterEnd.value) return false
  return dateString > filterStart.value && dateString < filterEnd.value
}

function clearFilter() { filterTitle.value = ''; filterStart.value = ''; filterEnd.value = ''; showFilterCal.value = false }

// 검색 필터 캘린더 상태 (일정 추가 캘린더와 독립)
const filterCalYear = ref(new Date().getFullYear())
const filterCalMonth = ref(new Date().getMonth())

function filterCalPrevMonth() {
  if (filterCalMonth.value === 0) { filterCalMonth.value = 11; filterCalYear.value-- } else filterCalMonth.value--
}
function filterCalNextMonth() {
  if (filterCalMonth.value === 11) { filterCalMonth.value = 0; filterCalYear.value++ } else filterCalMonth.value++
}

const filterCalDays = computed(() => {
  const year = filterCalYear.value
  const month = filterCalMonth.value
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

// 달력 날짜 생성
const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevMonthTotalDays = new Date(year, month, 0).getDate()
  
  const days = []
  
  // 지난 달의 남은 일수 채우기
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthTotalDays - i)
    days.push({
      date: d,
      dayNum: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateString: formatDateString(d)
    })
  }
  
  // 이번 달 일수 채우기
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    days.push({
      date: d,
      dayNum: i,
      isCurrentMonth: true,
      dateString: formatDateString(d)
    })
  }
  
  // 다음 달의 시작 일수 채우기
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: d,
      dayNum: i,
      isCurrentMonth: false,
      dateString: formatDateString(d)
    })
  }
  
  return days
})

function formatDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isDateInRange(dateString) {
  const { startDate, endDate } = form.value
  if (!startDate || !endDate) return false
  return dateString > startDate && dateString < endDate
}

function selectCalendarDate(dateString) {
  const { startDate, endDate } = form.value
  
  if (!startDate || (startDate && endDate)) {
    form.value.startDate = dateString
    form.value.endDate = ''
  } else {
    if (dateString < startDate) {
      form.value.startDate = dateString
    } else {
      form.value.endDate = dateString
    }
  }
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function resetForm() { form.value = { title: '', startDate: '', endDate: '', arrivalShared: false }; showCalendar.value = false }

function closeNewDialog() {
  showNewDialog.value = false
  resetForm()
}

async function createSchedule() {
  if (!form.value.title.trim()) { showToast('일정 제목을 입력해주세요.', 'error'); return }
  if (!form.value.startDate || !form.value.endDate) { showToast('여행 기간을 선택해주세요.', 'error'); return }
  isSaving.value = true
  try {
    const { data: res } = await scheduleApi.create({
      title: form.value.title.trim(),
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      arrivalShared: form.value.arrivalShared,
    })
    showToast('일정이 생성되었습니다!', 'success')
    router.push(`/schedule/${res.data.scheduleId}`)
  } catch (err) {
    showToast(err?.response?.data?.message || '저장에 실패했습니다.', 'error')
  } finally { isSaving.value = false }
}

async function handleVoice() {
  if (isListening.value) { voiceSearch.stopListening(); isListening.value = false; return }
  isListening.value = true
  try {
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`"${raw}"`, 'info')
    // 간단한 명령 파싱: "N번째 일정" 선택
    const match = raw.match(/(\d+)번/)
    if (match) {
      const idx = parseInt(match[1]) - 1
      if (filteredSchedules.value[idx]) { goToSchedule(filteredSchedules.value[idx].scheduleId); return }
    }
    showToast('일정 번호를 말씀해주세요. 예: "2번째 일정"', 'info')
  } catch { /* ignore */ } finally { isListening.value = false }
}
</script>


<style scoped>
.state-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; gap: 0.75rem; text-align: center; }
.empty-text { font-size: var(--font-size-body); font-weight: 600; color: var(--color-on-surface); }
.empty-sub { font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

/* 검색 필터 */
.filter-section { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
.filter-input {
  padding: 0.625rem 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant); background: #fff;
  font-size: var(--font-size-sm); color: var(--color-on-surface); font-family: inherit; outline: none;
  transition: border-color 0.15s; width: 100%; box-sizing: border-box;
}
.filter-input:focus { border-color: var(--color-primary); }
.filter-reset-btn {
  background: none; border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-DEFAULT); padding: 0.35rem 0.75rem;
  font-size: var(--font-size-sm); font-weight: 600;
  color: var(--color-on-surface-variant); cursor: pointer;
  transition: all 0.15s; flex-shrink: 0; white-space: nowrap;
}
.filter-reset-btn:hover { background: var(--color-surface-container); border-color: var(--color-primary); color: var(--color-primary); }

.list-section { margin-bottom: 1.5rem; }
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface); margin: 0; }
.section-hint { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); margin-bottom: 0.75rem; }

.schedule-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem; }
.schedule-card {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.875rem 1rem; border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-primary); background: var(--color-primary-soft);
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.schedule-card:hover { border-color: var(--color-primary-deep); background: var(--color-primary-100); }
.schedule-card__info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.schedule-card__title { font-size: var(--font-size-body); font-weight: 700; color: var(--color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.schedule-card__date { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.schedule-card__right { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
.schedule-card__count { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary-deep); }

/* 다이얼로그 */
.dialog-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.dialog-panel {
  background: var(--color-surface); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%; max-width: 480px; max-height: 80vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.dialog-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.25rem 0.75rem;
  border-bottom: 1px solid var(--color-outline-variant);
}
.dialog-panel__header h3 {
  font-size: var(--font-size-lg); font-weight: 700; color: var(--color-on-surface); margin: 0;
}
.dialog-close-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-on-surface-variant); display: flex; align-items: center;
  padding: 0.25rem; border-radius: var(--radius-sm); transition: background 0.15s;
}
.dialog-close-btn:hover { background: var(--color-surface-container-low); }
.dialog-panel__body {
  flex: 1; overflow-y: auto; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.875rem;
}
.dialog-hint {
  font-size: var(--font-size-sm); color: var(--color-on-surface-variant); margin: 0;
}
.dialog-panel__footer {
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
.date-sep { color: var(--color-outline); font-size: var(--font-size-sm); flex-shrink: 0; }
.date-field {
  flex: 1; display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 0.75rem; border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant); cursor: pointer;
  background: var(--color-surface-container-lowest); transition: border-color 0.15s;
}
.date-field:hover { border-color: var(--color-primary); }
.date-value { font-size: var(--font-size-sm); color: var(--color-on-surface); }
.date-value--placeholder { color: var(--color-outline); }

.date-field-wrap {
  position: relative;
  flex: 1;
}

.filter-cal-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  width: 280px;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
  padding: 1.25rem 1rem;
  box-sizing: border-box;
}


/* Voice FAB */
.voice-fab {
  position: fixed; bottom: calc(var(--bottom-nav-height) + 1.25rem); right: 1.25rem;
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: var(--color-primary); color: var(--color-on-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 40; box-shadow: 0 4px 12px rgba(0,0,0,.15); transition: all 0.18s;
}
.voice-fab:hover { transform: scale(1.05); }
.voice-fab--active { background: var(--color-error); animation: pulse-fab 1.2s infinite; }
@keyframes pulse-fab {
  0%,100% { box-shadow: 0 0 0 0 rgba(254,137,106,.5); }
  50% { box-shadow: 0 0 0 12px rgba(254,137,106,0); }
}
/* 인라인 캘린더 */
.calendar-inline {
  background: rgba(255, 255, 255, 0.98);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
}

.calendar-title {
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-on-surface);
}

.calendar-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-on-surface-variant);
  transition: background 0.15s;
}

.calendar-nav-btn:hover {
  background: var(--color-surface-container-high);
  color: var(--color-primary);
}

.calendar-grid-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-outline);
  margin-bottom: 0.5rem;
}

.calendar-grid-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-btn {
  aspect-ratio: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-on-surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.day-btn--current {
  color: var(--color-on-surface);
}

.day-btn--outside {
  color: var(--color-outline-variant);
}

.day-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.day-btn--in-range {
  background: var(--color-primary-soft) !important;
  color: var(--color-primary-deep);
  border-radius: 0;
}

.day-btn--selected {
  background: var(--color-primary) !important;
  color: var(--color-on-primary) !important;
  font-weight: 700;
}

.day-btn--start-cap {
  border-top-left-radius: 50%;
  border-bottom-left-radius: 50%;
}

.day-btn--end-cap {
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
}

/* 도착 알림 체크박스 */
.arrival-share-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0;
}
.arrival-share-check input {
  accent-color: var(--color-primary);
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.arrival-share-check__label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-on-surface-variant);
}
</style>

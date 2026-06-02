<template>
  <DefaultLayout :title="schedule?.title || '일정 관리'" show-back no-padding>
    <div v-if="isLoading" class="state-wrap"><LoadingSpinner /></div>
    <div v-else-if="!schedule" class="state-wrap">
      <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-outline);">error</span>
      <p>일정을 찾을 수 없습니다.</p>
      <BaseButton @click="$router.back()">뒤로 가기</BaseButton>
    </div>

    <template v-else>
      <!-- Hero Image -->
      <div class="hero">
        <img :src="heroImage" alt="" class="hero__img" @error="e => e.target.src = FALLBACK" />
      </div>

      <!-- Header Info -->
      <div class="manage-body">
        <div class="info-bar-container">
          <!-- 1. 일반 보기 모드 -->
          <div v-if="!isEditingHeader" class="info-bar-view">
            <div class="info-bar-view__content">
              <h1 class="info-bar-view__title">{{ schedule.title }}</h1>
              <div class="info-bar-view__date">
                <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-primary);">calendar_month</span>
                <span>{{ schedule.startDate }} ~ {{ schedule.endDate }}</span>
              </div>
            </div>
            <button class="info-bar-view__edit-btn" @click="isEditingHeader = true" aria-label="수정">
              <span class="material-symbols-outlined">edit</span>
            </button>
          </div>

          <!-- 2. 편집 모드 -->
          <div v-else class="info-bar-edit">
            <div class="info-bar-inputs">
              <!-- 타이틀 인풋 -->
              <input
                v-model="editForm.title"
                class="info-bar__title-input"
                placeholder="일정 제목을 입력하세요"
                @focus="onTitleFocus"
              />
              
              <!-- 날짜 선택 영역 (버튼 형태) -->
              <div class="info-bar__date-wrapper">
                <button class="info-bar__date-btn" @click.stop="showCalendar = !showCalendar">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-primary);">calendar_month</span>
                  <span>{{ editForm.startDate || '시작일' }} ~ {{ editForm.endDate || '종료일' }}</span>
                </button>
                
                <!-- 커스텀 캘린더 팝업 -->
                <div v-if="showCalendar" class="calendar-popup" @click.stop>
                  <div class="calendar-header">
                    <button class="calendar-nav-btn" @click="prevMonth">
                      <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span class="calendar-title">{{ calendarYear }}년 {{ calendarMonth + 1 }}월</span>
                    <button class="calendar-nav-btn" @click="nextMonth">
                      <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                  
                  <div class="calendar-grid-weekdays">
                    <span v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day" class="weekday">{{ day }}</span>
                  </div>
                  
                  <div class="calendar-grid-days">
                    <button
                      v-for="day in calendarDays"
                      :key="day.dateString"
                      :class="['day-btn', {
                        'day-btn--current': day.isCurrentMonth,
                        'day-btn--outside': !day.isCurrentMonth,
                        'day-btn--selected': day.dateString === editForm.startDate || day.dateString === editForm.endDate,
                        'day-btn--in-range': isDateInRange(day.dateString),
                        'day-btn--start-cap': day.dateString === editForm.startDate,
                        'day-btn--end-cap': day.dateString === editForm.endDate,
                      }]"
                      @click="selectCalendarDate(day.dateString)"
                    >
                      {{ day.dayNum }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 인라인 저장/취소 액션 -->
            <transition name="fade">
              <div class="info-bar-actions">
                <button class="action-btn action-btn--cancel" @click="cancelInlineEdit">취소</button>
                <button class="action-btn action-btn--save" :disabled="isSavingEdit" @click="saveInlineEdit">
                  <span v-if="isSavingEdit" class="spinner"></span>
                  <span v-else>저장</span>
                </button>
              </div>
            </transition>
          </div>
        </div>

        <!-- View Tabs -->
        <div class="view-tabs">
          <button :class="['vtab', { 'vtab--active': viewTab === 'list' }]" @click="viewTab = 'list'">일정 목록</button>
          <button :class="['vtab', { 'vtab--active': viewTab === 'map' }]" @click="viewTab = 'map'">지도에서 보기</button>
        </div>

        <!-- Day Tabs (Always Visible) -->
        <div class="day-tabs">
          <button :class="['dtab', { 'dtab--active': selectedDay === null }]" @click="selectedDay = null">전체</button>
          <button v-for="(d, i) in schedule.days" :key="d.date"
            :class="['dtab', { 'dtab--active': selectedDay === d.date }]"
            @click="selectedDay = d.date"
          >{{ i + 1 }}일차</button>
        </div>

        <!-- Route Controls (Visible when selectedDay is null OR viewTab is map) -->
        <div v-if="selectedDay === null || viewTab === 'map'" class="route-bar">
          <button :class="['route-btn', { 'route-btn--active': routeMode === 'departure' }]" @click="toggleRouteMode('departure')">
            <span class="material-symbols-outlined" style="font-size:1rem;">flag</span>
            {{ currentDepartureNodeId ? '출발지: ' + getNodeName(currentDepartureNodeId) : '출발지 선택' }}
          </button>
          <button :class="['route-btn', { 'route-btn--active': routeMode === 'arrival' }]" @click="toggleRouteMode('arrival')">
            <span class="material-symbols-outlined" style="font-size:1rem;">location_on</span>
            {{ currentArrivalNodeId ? '도착지: ' + getNodeName(currentArrivalNodeId) : '도착지 선택' }}
          </button>
          <button class="route-btn route-btn--auto" :disabled="isArranging" @click="handleAutoArrange">
            <span class="material-symbols-outlined" style="font-size:1rem;">auto_fix_high</span>자동 배치
          </button>
        </div>

        <!-- LIST VIEW -->
        <template v-if="viewTab === 'list'">
          <!-- Drag hint -->
          <p v-if="selectedDay" class="drag-hint">드래그로 순서 변경 후 저장하세요</p>

          <!-- Node List -->
          <template v-for="(d, di) in filteredDays" :key="d.date">
            <div v-if="selectedDay === null" class="day-header">{{ di + 1 }}일차 · {{ formatDate(d.date) }}</div>
            <draggable
              v-model="d.nodes"
              item-key="nodeId"
              handle=".drag-handle"
              :group="'schedule-nodes'"
              :move="checkMoveLimit"
              class="node-list"
              @start="onDragStart"
              @end="onDragEnd"
            >
              <template #item="{ element: node, index: ni }">
                <div
                  :class="['node-card', {
                    'node-card--departure': departureNodes[d.date] === node.nodeId,
                    'node-card--arrival': arrivalNodes[d.date] === node.nodeId,
                    'node-card--route-select': routeMode
                  }]"
                  @click="handleNodeClick(node, d.date)"
                >
                  <span class="drag-handle material-symbols-outlined" style="font-size:1.1rem;color:var(--color-outline);cursor:grab;">drag_indicator</span>
                  <span class="node-card__order">{{ ni + 1 }}</span>
                  <div class="node-card__info">
                    <div class="node-card__title-row">
                      <span class="node-card__name">{{ node.placeName }}</span>
                      <span class="node-card__badge">{{ getTypeLabel(node.contentTypeId) }}</span>
                    </div>
                    <span class="node-card__addr">{{ node.address }}</span>
                  </div>
                  <div class="node-card__actions">
                    <BaseButton size="xs" variant="secondary" @click.stop="goToAttractionDetail(node)">
                      상세 보기
                    </BaseButton>
                    <BaseButton size="xs" variant="accent" @click.stop="deleteNode(node)">
                      삭제
                    </BaseButton>
                  </div>
                </div>
              </template>
            </draggable>
          </template>

          <!-- Empty -->
          <div v-if="filteredDays.every(d => !d.nodes.length) && !unscheduledNodes.length" class="node-empty">
            등록된 관광지가 없습니다.
          </div>

          <!-- Unscheduled Nodes (draggable) -->
          <div v-if="unscheduledNodes.length" class="unsched-section">
            <h3 class="unsched-title">미등록 관광지</h3>
            <draggable
              v-model="schedule.unscheduledNodes"
              item-key="nodeId"
              handle=".drag-handle"
              :group="'schedule-nodes'"
              class="node-list"
              @start="onDragStart"
              @end="onDragEnd"
            >
              <template #item="{ element: node, index: ni }">
                <div class="node-card node-card--unsched">
                  <span class="drag-handle material-symbols-outlined" style="font-size:1.1rem;color:var(--color-outline);cursor:grab;">drag_indicator</span>
                  <span class="node-card__order">{{ ni + 1 }}</span>
                  <div class="node-card__info">
                    <div class="node-card__title-row">
                      <span class="node-card__name">{{ node.placeName }}</span>
                      <span class="node-card__badge">{{ getTypeLabel(node.contentTypeId) }}</span>
                    </div>
                    <span class="node-card__addr">{{ node.address }}</span>
                  </div>
                  <div class="node-card__actions">
                    <BaseButton size="xs" variant="secondary" @click.stop="goToAttractionDetail(node)">
                      상세 보기
                    </BaseButton>
                    <BaseButton size="xs" variant="accent" @click.stop="deleteNode(node)">
                      삭제
                    </BaseButton>
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Footer Actions -->
          <div class="manage-footer">
            <BaseButton variant="accent" @click="handleDelete">일정 삭제</BaseButton>
          </div>
        </template>

        <!-- MAP VIEW -->
        <template v-else>
          <div class="map-view-layout">
            <!-- 좌측/하단 관광지 리스트 -->
            <div class="map-view-sidebar">
              <h3 class="sidebar-title">
                {{ selectedDay ? getDayLabel(selectedDay) + ' 관광지' : '전체 일정 관광지' }}
              </h3>
              
              <div v-if="mapNodes.length" class="sidebar-list">
                <template v-for="(day, dayIdx) in filteredDays" :key="day.date">
                  <div v-if="day.nodes.length" class="sidebar-day-header">
                    {{ getDayNumLabel(day.date) }}일차 · {{ formatDate(day.date) }}
                  </div>
                  
                  <div
                    v-for="n in day.nodes"
                    :key="n.nodeId"
                    :class="['map-sidebar-card', {
                      'node-card--departure': departureNodes[day.date] === n.nodeId,
                      'node-card--arrival': arrivalNodes[day.date] === n.nodeId,
                      'node-card--route-select': routeMode
                    }]"
                    :style="`border-left-color: ${getDayColor(day.date)}`"
                    @click="handleMapCardClick(n, day.date)"
                  >
                    <div class="map-sidebar-card__thumb">
                      <img
                        :src="n.firstImageUrl || n.thumbnailImageUrl || FALLBACK"
                        :alt="n.placeName"
                        class="map-sidebar-card__img"
                        @error="e => e.target.src = FALLBACK"
                      />
                      <span class="map-sidebar-card__order" :style="`background-color: ${getDayColor(day.date)}`">
                        {{ n.visitOrder }}
                      </span>
                    </div>
                    <div class="map-sidebar-card__body">
                      <div class="map-sidebar-card__title-row">
                        <h4 class="map-sidebar-card__name">{{ n.placeName }}</h4>
                        <span class="map-sidebar-card__badge">{{ getTypeLabel(n.contentTypeId) }}</span>
                      </div>
                      <p class="map-sidebar-card__addr">{{ n.address }}</p>
                      <div class="map-sidebar-card__actions">
                        <BaseButton size="xs" variant="secondary" @click.stop="goToAttractionDetail(n)">
                          상세 보기
                        </BaseButton>
                        <BaseButton size="xs" variant="accent" @click.stop="deleteNode(n)">
                          삭제
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-else class="sidebar-empty">
                표시할 관광지가 없습니다.
              </div>
            </div>
            
            <!-- 우측/상단 지도 컨테이너 -->
            <div class="map-view-main">
              <div ref="mapContainer" class="map-container"></div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Voice FAB -->
    <button v-if="schedule" :class="['voice-fab', { 'voice-fab--active': isListening }]" aria-label="음성 명령" @click="handleVoice">
      <span class="material-symbols-outlined" style="font-size:1.75rem;">{{ isListening ? 'mic_off' : 'mic' }}</span>
    </button>


  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { scheduleApi } from '@/api/scheduleApi'
import { attractionApi } from '@/api/attractionApi'
import { useToast } from '@/composables/useToast'
import { useVoiceSearch } from '@/composables/useVoiceSearch'
import { CONTENT_TYPE_MAP } from '@/constants/enums'

const FALLBACK = 'https://placehold.co/800x400/DCE8C7/6F8F4E?text=My+Trip'
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const voiceSearch = useVoiceSearch()

const schedule = ref(null)
const isLoading = ref(true)
const viewTab = ref('list')
const selectedDay = ref(null)
const isListening = ref(false)
const isArranging = ref(false)
const mapContainer = ref(null)

// 인라인 에디팅 폼 상태
const isEditingHeader = ref(false)
const isSavingEdit = ref(false)
const editForm = ref({ title: '', startDate: '', endDate: '' })

// 커스텀 캘린더 팝업 상태
const showCalendar = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth()) // 0 ~ 11

// Route selection
const routeMode = ref(null) // 'departure' | 'arrival' | null
const departureNodes = ref({}) // key: date string, value: nodeId
const arrivalNodes = ref({})   // key: date string, value: nodeId

const currentDepartureNodeId = computed(() => {
  if (selectedDay.value) {
    return departureNodes.value[selectedDay.value] || null
  }
  const firstDate = schedule.value?.days?.[0]?.date
  return firstDate ? (departureNodes.value[firstDate] || null) : null
})

const currentArrivalNodeId = computed(() => {
  if (selectedDay.value) {
    return arrivalNodes.value[selectedDay.value] || null
  }
  const lastDate = schedule.value?.days?.[schedule.value?.days?.length - 1]?.date
  return lastDate ? (arrivalNodes.value[lastDate] || null) : null
})

let hasShownLimitWarning = false

function checkMoveLimit(evt) {
  if (evt.from !== evt.to && evt.relatedContext.list && evt.relatedContext.list.length >= 8) {
    if (!hasShownLimitWarning) {
      showToast('각 일차에는 최대 8개의 관광지만 등록할 수 있습니다.', 'warning')
      hasShownLimitWarning = true
    }
    return false
  }
  return true
}

const firstNode = computed(() => {
  if (!schedule.value) return null
  if (schedule.value.days) {
    for (const d of schedule.value.days) {
      if (d.nodes && d.nodes.length > 0) {
        return d.nodes[0]
      }
    }
  }
  if (schedule.value.unscheduledNodes && schedule.value.unscheduledNodes.length > 0) {
    return schedule.value.unscheduledNodes[0]
  }
  return null
})

const heroImage = ref(FALLBACK)

watch(
  () => firstNode.value?.attractionId,
  async (newId) => {
    if (!newId) {
      heroImage.value = FALLBACK
      return
    }
    try {
      const { data: res } = await attractionApi.getDetail(newId)
      const d = res.data
      heroImage.value = d?.firstImageUrl || d?.thumbnailImageUrl || FALLBACK
    } catch {
      heroImage.value = firstNode.value?.firstImageUrl || firstNode.value?.thumbnailImageUrl || FALLBACK
    }
  },
  { immediate: true }
)

const unscheduledNodes = computed(() => schedule.value?.unscheduledNodes || [])
const filteredDays = computed(() => {
  if (!schedule.value?.days) return []
  if (selectedDay.value === null) return schedule.value.days
  return schedule.value.days.filter(d => d.date === selectedDay.value)
})

const mapNodes = computed(() => {
  if (!schedule.value) return []
  if (selectedDay.value === null) {
    return schedule.value.days?.flatMap(d => d.nodes.map(n => ({ ...n, visitDate: d.date }))) || []
  }
  const day = schedule.value.days?.find(d => d.date === selectedDay.value)
  return day ? day.nodes.map(n => ({ ...n, visitDate: day.date })) : []
})

const DAY_COLORS = [
  '#4F46E5', // Indigo (Day 1)
  '#059669', // Emerald (Day 2)
  '#D97706', // Amber (Day 3)
  '#DC2626', // Red (Day 4)
  '#2563EB', // Blue (Day 5)
  '#7C3AED', // Violet (Day 6)
  '#0891B2', // Cyan (Day 7)
  '#DB2777', // Pink (Day 8)
]

function getDayColor(dateStr) {
  if (!schedule.value?.days) return '#9CA3AF'
  const idx = schedule.value.days.findIndex(d => d.date === dateStr)
  if (idx === -1) return '#9CA3AF'
  return DAY_COLORS[idx % DAY_COLORS.length]
}

function getDayNumLabel(dateStr) {
  if (!schedule.value?.days) return 1
  const idx = schedule.value.days.findIndex(d => d.date === dateStr)
  return idx !== -1 ? idx + 1 : 1
}

function getDayLabel(dateStr) {
  const num = getDayNumLabel(dateStr)
  return `${num}일차`
}

function getTypeLabel(id) { return CONTENT_TYPE_MAP[id]?.label || '관광지' }
function getNodeName(nodeId) {
  const all = [...(schedule.value?.days?.flatMap(d => d.nodes) || []), ...(schedule.value?.unscheduledNodes || [])]
  return all.find(n => n.nodeId === nodeId)?.placeName || ''
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }) : '' }

function toggleRouteMode(mode) {
  if (routeMode.value === mode) { routeMode.value = null; return }
  routeMode.value = mode
  showToast(`${mode === 'departure' ? '출발지' : '도착지'}로 설정할 노드를 선택하세요.`, 'info')
}

function handleNodeClick(node, date) {
  if (!routeMode.value) return
  if (!date) return

  if (!departureNodes.value[date]) departureNodes.value[date] = null
  if (!arrivalNodes.value[date]) arrivalNodes.value[date] = null

  if (routeMode.value === 'departure') {
    departureNodes.value[date] = departureNodes.value[date] === node.nodeId ? null : node.nodeId
    if (arrivalNodes.value[date] === node.nodeId) arrivalNodes.value[date] = null
  } else {
    arrivalNodes.value[date] = arrivalNodes.value[date] === node.nodeId ? null : node.nodeId
    if (departureNodes.value[date] === node.nodeId) departureNodes.value[date] = null
  }
  routeMode.value = null
}

function handleMapCardClick(node, date) {
  if (routeMode.value) {
    handleNodeClick(node, date)
  } else {
    focusMapMarker(node)
  }
}

onMounted(async () => {
  await loadDetail()
  window.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(e) {
  const picker = document.querySelector('.calendar-popup')
  const trigger = document.querySelector('.info-bar__date-btn')
  if (picker && !picker.contains(e.target) && trigger && !trigger.contains(e.target)) {
    showCalendar.value = false
  }
}

async function loadDetail() {
  isLoading.value = true
  try {
    const { data: res } = await scheduleApi.getById(route.params.scheduleId)
    schedule.value = res.data
    editForm.value = {
      title: res.data.title || '',
      startDate: res.data.startDate || '',
      endDate: res.data.endDate || ''
    }
    if (res.data.startDate) {
      const start = new Date(res.data.startDate)
      calendarYear.value = start.getFullYear()
      calendarMonth.value = start.getMonth()
    }
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast('일정을 불러오지 못했습니다.', 'error')
    }
  } finally { isLoading.value = false }
}

async function deleteNode(node) {
  if (!confirm(`"${node.placeName}"을(를) 삭제하시겠습니까?`)) return
  try {
    await scheduleApi.deleteNode(schedule.value.scheduleId, node.nodeId)
    showToast('삭제되었습니다.', 'success')

    // Reset deleted node from per-day selections
    for (const date in departureNodes.value) {
      if (departureNodes.value[date] === node.nodeId) {
        departureNodes.value[date] = null
      }
    }
    for (const date in arrivalNodes.value) {
      if (arrivalNodes.value[date] === node.nodeId) {
        arrivalNodes.value[date] = null
      }
    }

    await loadDetail()
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast('삭제에 실패했습니다.', 'error')
    }
  }
}

async function handleAutoArrange() {
  isArranging.value = true
  try {
    const payload = {
      days: (schedule.value.days || []).map(d => {
        return {
          date: d.date,
          startNodeId: departureNodes.value[d.date] ?? null,
          endNodeId: arrivalNodes.value[d.date] ?? null,
        }
      })
    }
    await scheduleApi.autoArrange(schedule.value.scheduleId, payload)
    showToast('일정이 성공적으로 수정되었습니다.', 'success')
    await loadDetail()
  } catch (err) {
    if (err?.response?.status !== 401) {
      showToast(err?.response?.data?.message || '자동 배치에 실패했습니다.', 'error')
    }
  } finally { isArranging.value = false }
}

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
  
  // 다음 달의 시작 일수 채우기 (총 42칸 채우기)
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
  const { startDate, endDate } = editForm.value
  if (!startDate || !endDate) return false
  return dateString > startDate && dateString < endDate
}

const isFormChanged = computed(() => {
  if (!schedule.value) return false
  return (
    editForm.value.title !== schedule.value.title ||
    editForm.value.startDate !== schedule.value.startDate ||
    editForm.value.endDate !== schedule.value.endDate
  )
})

function selectCalendarDate(dateString) {
  const { startDate, endDate } = editForm.value
  
  if (!startDate || (startDate && endDate)) {
    editForm.value.startDate = dateString
    editForm.value.endDate = ''
  } else {
    if (dateString < startDate) {
      editForm.value.startDate = dateString
    } else {
      editForm.value.endDate = dateString
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

function cancelInlineEdit() {
  if (!schedule.value) return
  editForm.value = {
    title: schedule.value.title,
    startDate: schedule.value.startDate,
    endDate: schedule.value.endDate
  }
  showCalendar.value = false
  isEditingHeader.value = false
}

async function saveInlineEdit() {
  if (!editForm.value.title.trim()) { showToast('일정 제목을 입력하세요.', 'error'); return }
  if (!editForm.value.startDate || !editForm.value.endDate) { showToast('여행 일자를 완성해주세요.', 'error'); return }
  
  if (schedule.value) {
    const prevDays = schedule.value.days?.length || 0
    const start = new Date(editForm.value.startDate)
    const end = new Date(editForm.value.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    if (diffDays < prevDays) {
      if (!confirm('여행 기간을 줄이면 일부 보관된 관광지들이 미등록으로 이동할 수 있습니다. 계속하시겠습니까?')) {
        return
      }
    }
  }

  isSavingEdit.value = true
  try {
    await scheduleApi.update(schedule.value.scheduleId, {
      title: editForm.value.title.trim(),
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate,
    })
    showToast('일정이 성공적으로 수정되었습니다.', 'success')
    showCalendar.value = false
    isEditingHeader.value = false
    await loadDetail()
  } catch (err) {
    showToast(err?.response?.data?.message || '수정에 실패했습니다.', 'error')
  } finally { isSavingEdit.value = false }
}

function onTitleFocus() {
  showCalendar.value = false
}

async function handleDelete() {
  if (!confirm('이 일정을 삭제하시겠습니까?')) return
  try {
    await scheduleApi.delete(schedule.value.scheduleId)
    showToast('일정이 삭제되었습니다.', 'success')
    router.push('/schedules')
  } catch { showToast('삭제에 실패했습니다.', 'error') }
}

// 드래그앤드롭 변경 감지(Dirty Check)용 상태
let dragStartState = null

function onDragStart() {
  hasShownLimitWarning = false
  if (!schedule.value?.days) return
  // 드래그 시작 시점의 days 노드 배열 구조 캡처
  dragStartState = JSON.stringify(schedule.value.days.map(d => ({
    date: d.date,
    nodeIds: d.nodes.map(n => n.nodeId)
  })))
}

// 드래그 종료 시 배치 저장 (리스트 간 이동 포함)
async function onDragEnd() {
  hasShownLimitWarning = false
  if (!schedule.value?.days) return

  // visitOrder 순차 세팅
  schedule.value.days.forEach(d => {
    d.nodes.forEach((n, i) => { n.visitOrder = i + 1 })
  })

  // 1. 예외 처리: 모든 일차를 통틀어 배치된 노드가 0개인 경우 (미등록 목록 내 이동 또는 초기 빈 일정 상태)
  const totalPlacedNodes = schedule.value.days.reduce((sum, d) => sum + d.nodes.length, 0)
  if (totalPlacedNodes === 0) {
    // API 호출 불필요 (성공으로 자연스럽게 리턴하여 400 Bad Request 에러 예방)
    return
  }

  // 2. 변경 감지 (Dirty Check): 드래그 시작 시와 종료 시의 배치 구성이 동일하면 API 호출하지 않음
  const currentState = JSON.stringify(schedule.value.days.map(d => ({
    date: d.date,
    nodeIds: d.nodes.map(n => n.nodeId)
  })))

  if (dragStartState === currentState) {
    return
  }

  try {
    await scheduleApi.savePlacement(schedule.value.scheduleId, schedule.value.days.map(d => ({
      date: d.date,
      nodes: d.nodes.map((n, i) => ({ nodeId: n.nodeId, visitOrder: i + 1 }))
    })))
    showToast('순서가 저장되었습니다.', 'success')
  } catch (err) {
    showToast(err?.response?.data?.message || '저장에 실패했습니다.', 'error')
    await loadDetail()
  }
}

// Map
let kakaoMapInstance = null
const currentOverlays = ref([])

watch([viewTab, selectedDay], async ([vTab, sDay]) => {
  if (vTab === 'map') {
    await nextTick()
    initMap()
  }
})

function focusMapMarker(node) {
  if (!kakaoMapInstance || !node.latitude || !node.longitude) return
  const pos = new window.kakao.maps.LatLng(node.latitude, node.longitude)
  kakaoMapInstance.panTo(pos)
}

async function initMap() {
  if (!mapContainer.value) return
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key) { showToast('카카오맵 키가 없습니다.', 'error'); return }

  await new Promise(resolve => {
    if (window.kakao?.maps) { window.kakao.maps.load(resolve); return }
    const s = document.createElement('script')
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    s.onload = () => window.kakao.maps.load(resolve)
    document.head.appendChild(s)
  })

  // Clear existing overlays
  currentOverlays.value.forEach(overlay => overlay.setMap(null))
  currentOverlays.value = []

  const activeNodes = mapNodes.value.filter(n => n.latitude && n.longitude)
  if (!activeNodes.length) {
    const defaultCenter = new window.kakao.maps.LatLng(35.1795543, 129.0756416)
    kakaoMapInstance = new window.kakao.maps.Map(mapContainer.value, { center: defaultCenter, level: 7 })
    return
  }

  const center = new window.kakao.maps.LatLng(activeNodes[0].latitude, activeNodes[0].longitude)
  const map = new window.kakao.maps.Map(mapContainer.value, { center, level: 7 })
  kakaoMapInstance = map
  const bounds = new window.kakao.maps.LatLngBounds()

  activeNodes.forEach((n) => {
    const pos = new window.kakao.maps.LatLng(n.latitude, n.longitude)
    bounds.extend(pos)

    const color = getDayColor(n.visitDate || schedule.value.startDate)
    
    const markerWrap = document.createElement('div')
    markerWrap.className = 'custom-num-marker-wrap'

    const markerEl = document.createElement('div')
    markerEl.className = 'custom-num-marker'
    markerEl.style.borderColor = color
    markerEl.style.backgroundColor = color
    markerEl.innerHTML = `<span>${n.visitOrder}</span>`

    const labelEl = document.createElement('div')
    labelEl.className = 'custom-num-marker-label'
    labelEl.innerText = n.placeName

    markerWrap.appendChild(markerEl)
    markerWrap.appendChild(labelEl)
    
    markerWrap.addEventListener('click', () => {
      map.panTo(pos)
    })

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content: markerWrap,
      yAnchor: 0.5,
      xAnchor: 0.5
    })
    
    overlay.setMap(map)
    currentOverlays.value.push(overlay)
  })

  if (activeNodes.length > 1) {
    map.setBounds(bounds)
  } else {
    map.setCenter(center)
  }
}

// Voice
async function handleVoice() {
  if (isListening.value) { voiceSearch.stopListening(); isListening.value = false; return }
  isListening.value = true
  try {
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`🎤 "${raw}"`, 'info')

    // 현재 보이는 일정 노드 (일차별 visitOrder 기준 1~n)
    const dayNodes = filteredDays.value.flatMap(d => d.nodes)
    // 미등록 관광지 (nodeId 순 정렬, 1~n 번호)
    const unscheduled = [...(schedule.value?.unscheduledNodes || [])].sort((a, b) => a.nodeId - b.nodeId)

    // 위치 변경: "N번과 M번 바꿔" | "N번 M번 교환"
    if (raw.includes('바꿔') || raw.includes('바꾸') || raw.includes('교환') || raw.includes('변경')) {
      const nums = raw.match(/(\d+)/g)
      if (nums && nums.length >= 2) {
        const a = parseInt(nums[0]) - 1
        const b = parseInt(nums[1]) - 1
        if (selectedDay.value) {
          const day = schedule.value.days.find(d => d.date === selectedDay.value)
          if (day && day.nodes[a] && day.nodes[b]) {
            const temp = day.nodes[a]
            day.nodes[a] = day.nodes[b]
            day.nodes[b] = temp
            day.nodes.forEach((n, i) => { n.visitOrder = i + 1 })
            await onDragEnd()
            showToast(`${a + 1}번과 ${b + 1}번 위치를 변경했습니다.`, 'success')
            return
          }
        }
        showToast('해당 번호의 관광지를 찾을 수 없습니다. 일차를 선택해주세요.', 'error')
        return
      }
    }

    // 삭제: "N번 삭제"
    if (raw.includes('삭제')) {
      const m = raw.match(/(\d+)번/)
      if (m) {
        const idx = parseInt(m[1]) - 1
        const node = dayNodes[idx] ?? unscheduled[idx]
        if (node) { await deleteNode(node); return }
      }
    }

    // 일정 읽기: "읽어" | "알려"
    if (raw.includes('읽어') || raw.includes('알려')) {
      const names = dayNodes.map((n, i) => `${i + 1}. ${n.placeName}`).join(', ')
      showToast(names || '등록된 관광지가 없습니다.', 'info')
      return
    }

    // 수정 모달 열기: "수정" | "제목"
    if (raw.includes('수정') || raw.includes('제목')) {
      openEditModal()
      return
    }

    showToast('명령어: "바꿔", "삭제", "읽어", "수정"', 'info')
  } catch { /* ignore */ } finally { isListening.value = false }
}

function goToAttractionDetail(node) {
  router.push(`/attraction/${node.attractionId}`)
}
</script>

<style scoped>
.state-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; gap: 1rem; text-align: center; }

.hero { width: 100%; }
.hero__img { width: 100%; aspect-ratio: 16/9; max-height: 360px; object-fit: cover; display: block; }

.manage-body { padding: 1rem 1rem 6rem; }
@media (min-width: 768px) { .manage-body { padding: 1.5rem 200px 6rem; } }

.info-bar-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.info-bar-view__content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.info-bar-view__title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-bar-view__date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  font-weight: 600;
}

.info-bar-view__edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.info-bar-view__edit-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: scale(1.05);
}

.info-bar-container {
  margin-bottom: 1.25rem;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.info-bar-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .info-bar-edit {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
  }
}

.info-bar-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.info-bar__title-input {
  width: 100%;
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-on-surface);
  border: 1px solid transparent;
  background: transparent;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.2s ease;
  margin-left: -0.5rem;
}

.info-bar__title-input:hover {
  background: var(--color-surface-container-high);
}

.info-bar__title-input:focus {
  background: var(--color-surface);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.info-bar__date-wrapper {
  position: relative;
  width: 100%;
}

@media (min-width: 768px) {
  .info-bar__date-wrapper {
    width: fit-content;
  }
}

.info-bar__date-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

@media (min-width: 768px) {
  .info-bar__date-btn {
    width: auto;
  }
}

.info-bar__date-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

/* 커스텀 캘린더 팝업 */
.calendar-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: 100%;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
  padding: 1.25rem 1rem;
}

@media (min-width: 768px) {
  .calendar-popup {
    left: 0;
    transform: none;
    width: 320px;
  }
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

/* 인라인 액션 버튼 */
.info-bar-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

@media (min-width: 768px) {
  .info-bar-actions {
    margin-top: 0;
    align-self: flex-end;
  }
}

.action-btn {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-xs);
  font-weight: 700;
  border-radius: var(--radius-full);
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.action-btn--cancel {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface-variant);
}

.action-btn--cancel:hover {
  background: var(--color-outline-variant);
}

.action-btn--save {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.action-btn--save:hover {
  background: var(--color-primary-deep);
  box-shadow: 0 4px 12px var(--color-primary-soft);
}

.action-btn--save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* View Tabs */
.view-tabs { display: flex; gap: 0; border-radius: var(--radius-DEFAULT); overflow: hidden; border: 1.5px solid var(--color-primary); margin-bottom: 1rem; }
.vtab {
  flex: 1; padding: 0.625rem; text-align: center; font-size: var(--font-size-sm); font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s;
  background: var(--color-surface); color: var(--color-primary);
}
.vtab--active { background: var(--color-primary); color: var(--color-on-primary); }

/* Day Tabs */
.day-tabs { display: flex; gap: 0.375rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 0.75rem; -webkit-overflow-scrolling: touch; }
.day-tabs::-webkit-scrollbar { display: none; }
.dtab {
  flex-shrink: 0; padding: 0.4rem 0.875rem; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;
  border: 1.5px solid var(--color-outline-variant); background: var(--color-surface-container-lowest);
  color: var(--color-on-surface-variant); cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.dtab--active { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }

/* Route bar */
.route-bar { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; }
.route-btn {
  display: flex; align-items: center; gap: 0.25rem; padding: 0.4rem 0.625rem;
  border-radius: var(--radius-DEFAULT); font-size: var(--font-size-xs); font-weight: 600;
  border: 1.5px solid var(--color-outline-variant); background: var(--color-surface-container-lowest);
  color: var(--color-on-surface-variant); cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.route-btn--active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
.route-btn--auto { border-color: var(--color-accent); color: var(--color-accent); }
.route-btn--auto:hover { background: rgba(254,137,106,.1); }

/* Day header */
.day-header { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary-deep); padding: 0.5rem 0 0.25rem; }

/* Node card */
.node-list { display: flex; flex-direction: column; gap: 0.5rem; min-height: 2rem; }
.node-card {
  display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 0.875rem;
  border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest); transition: border-color 0.15s;
}
.node-card--route-select { cursor: pointer; }
.node-card--route-select:hover { border-color: var(--color-primary); }
.node-card--departure { border-color: var(--color-primary); background: var(--color-primary-soft); }
.node-card--arrival { border-color: var(--color-accent); background: rgba(254,137,106,.08); }
.node-card--unsched { border-style: dashed; }
.node-card__order {
  width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary);
  color: var(--color-on-primary); font-size: var(--font-size-xs); font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.node-card__info { flex: 1; min-width: 0; }
.node-card__name { display: block; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.node-card__type { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.node-card__del { background: none; border: none; cursor: pointer; color: var(--color-outline); padding: 0.25rem; border-radius: 50%; transition: color 0.15s; }
.node-card__del:hover { color: var(--color-error); }
.node-empty { text-align: center; padding: 2rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); }

/* Unsched */
.unsched-section { margin-top: 1.25rem; }
.unsched-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface-variant); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem; }

/* Footer */
.manage-footer { display: flex; gap: 0.75rem; margin-top: 1.5rem; }

/* Map */
.map-view-layout {
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  height: calc(100vh - 280px);
  min-height: 500px;
}

@media (min-width: 768px) {
  .map-view-layout {
    flex-direction: row;
    height: 600px;
    align-items: stretch;
  }
}

.map-view-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .map-view-sidebar {
    max-width: 320px;
    flex: 0 0 320px;
  }
}

.sidebar-title {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-on-surface);
  margin-bottom: 1rem;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 4px;
}

.sidebar-list::-webkit-scrollbar {
  width: 4px;
}
.sidebar-list::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-list::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 2px;
}

.node-card__actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.node-card__actions :deep(button) {
  padding: 0.3rem 0.5rem !important;
  font-size: 0.7rem !important;
  height: auto !important;
}

/* Premium Map Sidebar Card style (horizontal split layout) */
.map-sidebar-card {
  display: flex;
  flex-direction: row;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-outline-variant);
  border-left-width: 5px; /* Colored by day border */
  background: var(--color-surface);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
  min-height: 110px;
}

.map-sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--color-outline);
}

.map-sidebar-card__thumb {
  position: relative;
  width: 35%;
  max-width: 100px;
  min-height: 80px;
  flex-shrink: 0;
}

.map-sidebar-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.map-sidebar-card__order {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

.map-sidebar-card__body {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.625rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.25rem;
}

.map-sidebar-card__name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.map-sidebar-card__info {
  font-size: 11px;
  color: var(--color-on-surface-variant);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-sidebar-card__type {
  font-weight: 600;
  color: var(--color-primary-deep);
}

.map-sidebar-card__day-info {
  font-weight: 600;
}

.map-sidebar-card__actions {
  display: flex;
  gap: 0.3rem;
  width: 100%;
}

.map-sidebar-card__actions :deep(button) {
  flex: 1;
  padding: 0.25rem 0.35rem !important;
  font-size: 10px !important;
  height: auto !important;
  white-space: nowrap;
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  text-align: center;
}

.map-view-main {
  flex: 2;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-outline-variant);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

@media (max-width: 767px) {
  .map-view-main {
    height: 350px;
    flex: none;
  }
}

.map-container {
  width: 100%;
  height: 100%;
}

:deep(.custom-num-marker-wrap) {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
}

:deep(.custom-num-marker) {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 2;
}

:deep(.custom-num-marker-wrap:hover .custom-num-marker) {
  transform: scale(1.15);
  z-index: 100 !important;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.45);
}

:deep(.custom-num-marker-label) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-outline-variant);
  color: var(--color-on-surface);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  margin-top: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-card__title-row, .map-sidebar-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.node-card__badge, .map-sidebar-card__badge {
  background: var(--color-primary-soft);
  color: var(--color-primary-deep);
  font-size: 10px;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary-200);
}

.node-card__addr, .map-sidebar-card__addr {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  margin-top: 0.125rem;
  text-align: left;
}

.sidebar-day-header {
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: var(--color-primary-deep);
  padding: 0.625rem 0.25rem 0.25rem;
  border-bottom: 2px solid var(--color-primary-100);
  margin-bottom: 0.5rem;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
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
</style>

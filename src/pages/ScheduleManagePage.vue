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
            <div class="info-bar-view__actions">
              <BaseButton size="xs" variant="secondary" @click="isEditingHeader = true">수정</BaseButton>
              <BaseButton size="xs" variant="accent" @click="handleDelete">삭제</BaseButton>
            </div>
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
          <button
            :class="['dtab', { 'dtab--active': selectedDay === null }]"
            :style="selectedDay === null ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#ffffff' } : {}"
            @click="selectedDay = null"
          >전체</button>
          <button v-for="(d, i) in schedule.days" :key="d.date"
            :class="['dtab', { 'dtab--active': selectedDay === d.date }]"
            :style="getDayChipStyle(d.date, selectedDay === d.date)"
            @click="selectedDay = d.date"
          >{{ i + 1 }}일차</button>
        </div>

        <!-- Route Controls (List view only) -->
        <div v-if="viewTab === 'list' && selectedDay === null" class="route-section">
          <!-- 자동 배치 안내 배너 -->
          <div v-if="showAutoGuide" class="auto-guide-banner">
            <span class="material-symbols-outlined" style="font-size:1.25rem;color:var(--color-primary);">route</span>
            <div class="auto-guide-banner__text">
              <strong>출발지와 도착지를 선택하면 최적 경로로 자동 배치합니다</strong>
              <span>각 일차별로 출발지·도착지를 지정한 뒤 "자동 배치 실행"을 눌러주세요. (선택 안 하면 자동 결정)</span>
            </div>
            <button class="auto-guide-banner__close" @click="showAutoGuide = false">
              <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
            </button>
          </div>

          <div class="route-bar">
            <div class="route-btn-group">
              <button class="route-btn route-btn--auto" :disabled="isArranging || !canAutoArrange" @click="onAutoArrangeClick">
                <span class="material-symbols-outlined" style="font-size:1rem;">auto_fix_high</span>
                {{ showAutoGuide ? '자동 배치 실행' : '자동 배치' }}
              </button>
              <span v-if="!canAutoArrange" class="auto-tooltip-wrap">
                <span class="material-symbols-outlined auto-info-icon">info</span>
                <span class="auto-tooltip">각 일차별 관광지 3개부터 자동배치가 가능합니다</span>
              </span>
            </div>
          </div>
        </div>

        <!-- LIST VIEW -->
        <template v-if="viewTab === 'list'">
          <!-- Node List Wrapper (오버레이 포함) -->
          <div class="node-list-wrapper">
            <!-- Processing Overlay -->
            <div v-if="isProcessing" class="processing-overlay">
              <div class="processing-spinner">
                <LoadingSpinner :text="processingMessage" />
              </div>
            </div>

            <!-- Node List -->
            <template v-for="(d, di) in filteredDays" :key="d.date">
              <div v-if="selectedDay === null" class="day-header">
                <span>{{ di + 1 }}일차 · {{ formatDate(d.date) }}</span>
                <div class="day-header__routes">
                  <button
                    :class="['day-route-btn', { 'day-route-btn--active': departureNodes[d.date] }]"
                    @click.stop="toggleDayRouteMode(d.date, 'departure')"
                    :title="departureNodes[d.date] ? '출발지: ' + getNodeName(departureNodes[d.date]) : '출발지 선택'"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.8rem;">flag</span>
                    {{ departureNodes[d.date] ? getNodeName(departureNodes[d.date]) : '출발지' }}
                  </button>
                  <button
                    :class="['day-route-btn', { 'day-route-btn--active': arrivalNodes[d.date] }]"
                    @click.stop="toggleDayRouteMode(d.date, 'arrival')"
                    :title="arrivalNodes[d.date] ? '도착지: ' + getNodeName(arrivalNodes[d.date]) : '도착지 선택'"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.8rem;">location_on</span>
                    {{ arrivalNodes[d.date] ? getNodeName(arrivalNodes[d.date]) : '도착지' }}
                  </button>
                </div>
              </div>
              <draggable
                v-model="d.nodes"
                :data-date="d.date"
                item-key="nodeId"
                handle=".drag-handle"
                :group="{ name: 'schedule-nodes', put: (to, from) => checkPutLimit(to, from, d) }"
                :disabled="isProcessing"
                class="node-list"
                @start="onDragStart"
                @end="onDragEnd"
              >
                <template #item="{ element: node, index: ni }">
                  <div class="node-item-wrap">
                    <!-- 간선 커넥터 (이전 노드와의 이동 정보) -->
                    <div v-if="ni > 0" class="edge-connector">
                      <div class="edge-connector__line" :style="`border-left-color: ${getDayColor(d.date)}`" />
                      <div v-if="getEdgeBetween(d, d.nodes[ni - 1]?.nodeId, node.nodeId)" class="edge-connector__info">
                        <span class="material-symbols-outlined" style="font-size:0.85rem;">directions_car</span>
                        <span>{{ formatDuration(getEdgeBetween(d, d.nodes[ni - 1]?.nodeId, node.nodeId).estimatedTimeMinutes) }}</span>
                        <span class="edge-connector__dot">·</span>
                        <span>{{ formatDistance(getEdgeBetween(d, d.nodes[ni - 1]?.nodeId, node.nodeId).distanceMeters) }}</span>
                      </div>
                      <div v-else class="edge-connector__info edge-connector__info--empty">
                        <span class="material-symbols-outlined" style="font-size:0.85rem;">more_horiz</span>
                        <span>거리 계산 필요</span>
                      </div>
                    </div>

                    <div
                      :class="['node-card', {
                        'node-card--departure': departureNodes[d.date] === node.nodeId,
                        'node-card--arrival': arrivalNodes[d.date] === node.nodeId,
                        'node-card--route-select': activeDayRoute
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
                        <BaseButton size="xs" variant="primary" @click.stop="excludeNode(node)">
                          일정에서 제외
                        </BaseButton>
                        <BaseButton size="xs" variant="accent" @click.stop="deleteNode(node)">
                          삭제
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
            </template>

          <!-- Empty -->
          <div v-if="filteredDays.every(d => !d.nodes.length) && !unscheduledNodes.length" class="node-empty">
            <p>등록된 관광지가 없습니다.</p>
            <button class="add-place-btn add-place-btn--lg" @click="router.push('/attractions')">
              <span class="material-symbols-outlined" style="font-size:1rem;">add</span>
              여행지 추가하기
            </button>
          </div>

          <!-- Unscheduled Nodes (draggable) -->
          <div class="unsched-section">
            <div class="unsched-header">
              <h3 class="unsched-title">미등록 관광지</h3>
              <button class="add-place-btn" @click="router.push('/attractions')">
                <span class="material-symbols-outlined" style="font-size:0.875rem;">add</span>
                여행지 추가하기
              </button>
            </div>
            <draggable
              v-model="schedule.unscheduledNodes"
              item-key="nodeId"
              handle=".drag-handle"
              :group="'schedule-nodes'"
              :sort="false"
              class="node-list"
              @start="onDragStart"
              @end="onDragEnd"
            >
              <template #header>
                <div v-if="unscheduledNodes.length === 0" class="empty-dropzone empty-dropzone--unsched">
                  여기로 관광지를 드래그하여 일정에서 제외하세요
                </div>
              </template>
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

          </div> <!-- /node-list-wrapper -->

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
                  
                  <template v-for="(n, ni) in day.nodes" :key="n.nodeId">
                    <!-- 간선 커넥터 (이전 노드와의 이동 정보) -->
                    <div v-if="ni > 0" class="edge-connector">
                      <div class="edge-connector__line" :style="`border-left-color: ${getDayColor(day.date)}`" />
                      <div v-if="getEdgeBetween(day, day.nodes[ni - 1]?.nodeId, n.nodeId)" class="edge-connector__info">
                        <span class="material-symbols-outlined" style="font-size:0.85rem;">directions_car</span>
                        <span>{{ formatDuration(getEdgeBetween(day, day.nodes[ni - 1]?.nodeId, n.nodeId).estimatedTimeMinutes) }}</span>
                        <span class="edge-connector__dot">·</span>
                        <span>{{ formatDistance(getEdgeBetween(day, day.nodes[ni - 1]?.nodeId, n.nodeId).distanceMeters) }}</span>
                      </div>
                      <div v-else class="edge-connector__info edge-connector__info--empty">
                        <span class="material-symbols-outlined" style="font-size:0.85rem;">more_horiz</span>
                        <span>거리 계산 필요</span>
                      </div>
                    </div>

                    <div
                      :class="['map-sidebar-card', {
                        'node-card--departure': departureNodes[day.date] === n.nodeId,
                        'node-card--arrival': arrivalNodes[day.date] === n.nodeId,
                        'node-card--route-select': false
                      }]"
                      :style="`border-left-color: ${getDayColor(day.date)}`"
                      @click="focusMapMarker(n)"
                    >
                      <div class="map-sidebar-card__body">
                        <div class="map-sidebar-card__title-row">
                          <span class="map-sidebar-card__order" :style="`background-color: ${getDayColor(day.date)}`">
                            {{ n.visitOrder }}
                          </span>
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

    <!-- BaseDialog -->
    <BaseDialog
      v-model="showConfirmDialog"
      :title="dialogConfig.title"
      :message="dialogConfig.message"
      :confirm-variant="dialogConfig.confirmVariant"
      @confirm="dialogConfig.onConfirm"
      @cancel="dialogConfig.onCancel"
    />
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
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

const showConfirmDialog = ref(false)
const dialogConfig = ref({
  title: '',
  message: '',
  confirmVariant: 'primary',
  onConfirm: () => {},
  onCancel: () => {}
})

function openConfirm({ title, message, confirmVariant = 'primary', onConfirm, onCancel }) {
  dialogConfig.value = {
    title,
    message,
    confirmVariant,
    onConfirm: () => {
      onConfirm?.()
      showConfirmDialog.value = false
    },
    onCancel: () => {
      onCancel?.()
      showConfirmDialog.value = false
    }
  }
  showConfirmDialog.value = true
}

const schedule = ref(null)
const isLoading = ref(true)
const viewTab = ref('list')
const selectedDay = ref(null)
const isListening = ref(false)
const isArranging = ref(false)
const isReordering = ref(false)
const showAutoGuide = ref(false)
const mapContainer = ref(null)

const canAutoArrange = computed(() => {
  if (!schedule.value?.days?.length) return false
  return schedule.value.days.every(d => d.nodes.length >= 3)
})

const isProcessing = computed(() => isArranging.value || isListening.value || isReordering.value)
const processingMessage = computed(() => {
  if (isArranging.value) return '여행 일정을 수정 중입니다'
  if (isReordering.value) return '순서 저장 중...'
  if (isListening.value) return '음성 명령 처리 중...'
  return ''
})

// 인라인 에디팅 폼 상태
const isEditingHeader = ref(false)
const isSavingEdit = ref(false)
const editForm = ref({ title: '', startDate: '', endDate: '' })

// 커스텀 캘린더 팝업 상태
const showCalendar = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth()) // 0 ~ 11

// Route selection (per-day)
const activeDayRoute = ref(null) // { date, mode: 'departure'|'arrival' } or null
const departureNodes = ref({}) // key: date string, value: nodeId
const arrivalNodes = ref({})   // key: date string, value: nodeId

function toggleDayRouteMode(date, mode) {
  if (activeDayRoute.value?.date === date && activeDayRoute.value?.mode === mode) {
    activeDayRoute.value = null
    return
  }
  activeDayRoute.value = { date, mode }
  showToast(`${mode === 'departure' ? '출발지' : '도착지'}로 설정할 관광지를 클릭하세요.`, 'info')
}

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

function checkPutLimit(to, from, targetDay) {
  if (to.el === from.el) return true
  if (targetDay && targetDay.nodes.length >= 8) {
    if (!hasShownLimitWarning) {
      showToast('각 일차에는 최대 8개의 관광지만 등록할 수 있습니다.', 'error')
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

function getDayChipStyle(date, isActive) {
  const color = getDayColor(date)
  if (isActive) {
    return {
      backgroundColor: color,
      borderColor: color,
      color: '#ffffff',
    }
  } else {
    return {
      borderColor: `${color}40`,
      color: color,
      backgroundColor: `${color}08`,
    }
  }
}

// 간선(Edge) 정보 헬퍼
function getEdgeBetween(day, fromNodeId, toNodeId) {
  if (!day?.edges) return null
  return day.edges.find(e => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) || null
}

function formatDistance(meters) {
  if (!meters) return ''
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

function formatDuration(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
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

function handleNodeClick(node, date) {
  if (!activeDayRoute.value) return
  const { date: targetDate, mode } = activeDayRoute.value
  // 다른 일차의 노드를 클릭한 경우 무시
  if (date !== targetDate) {
    showToast('해당 일차의 관광지를 선택해주세요.', 'warning')
    return
  }

  if (mode === 'departure') {
    departureNodes.value[date] = departureNodes.value[date] === node.nodeId ? null : node.nodeId
    if (arrivalNodes.value[date] === node.nodeId) arrivalNodes.value[date] = null
  } else {
    arrivalNodes.value[date] = arrivalNodes.value[date] === node.nodeId ? null : node.nodeId
    if (departureNodes.value[date] === node.nodeId) departureNodes.value[date] = null
  }
  activeDayRoute.value = null
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

function deleteNode(node) {
  openConfirm({
    title: '관광지 삭제',
    message: `"${node.placeName}"을(를) 삭제하시겠습니까?`,
    confirmVariant: 'accent',
    onConfirm: async () => {
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
  })
}

function excludeNode(node) {
  try {
    if (!schedule.value || !schedule.value.days) {
      showToast('일정 정보가 없습니다.', 'error')
      return
    }

    let targetDay = null
    let nodeIndex = -1

    for (const day of schedule.value.days) {
      nodeIndex = day.nodes.findIndex(n => Number(n.nodeId) === Number(node.nodeId))
      if (nodeIndex !== -1) {
        targetDay = day
        break
      }
    }

    if (!targetDay) {
      showToast('일정에서 해당 관광지를 찾을 수 없습니다.', 'error')
      return
    }

    // 일차 노드 목록에서 제거 및 반응성 보장을 위한 새 배열 할당
    const newDayNodes = [...targetDay.nodes]
    const [removedNode] = newDayNodes.splice(nodeIndex, 1)
    targetDay.nodes = newDayNodes

    // 미등록 관광지 목록에 추가 및 반응성 보장을 위한 새 배열 할당
    const newUnscheduled = schedule.value.unscheduledNodes ? [...schedule.value.unscheduledNodes] : []
    const exists = newUnscheduled.some(n => Number(n.nodeId) === Number(removedNode.nodeId))
    if (!exists) {
      removedNode.visitOrder = null
      removedNode.visitDate = null
      newUnscheduled.push(removedNode)
    }
    schedule.value.unscheduledNodes = newUnscheduled

    dragStartState = '' // 변경사항 저장을 위한 Dirty Check 강제 우회
    onDragEnd()
  } catch (e) {
    console.error('excludeNode error:', e)
    showToast('제외 처리에 실패했습니다.', 'error')
  }
}

function onAutoArrangeClick() {
  if (!showAutoGuide.value) {
    // 첫 클릭: 안내 배너 표시
    showAutoGuide.value = true
    return
  }
  // 두 번째 클릭: 실행
  showAutoGuide.value = false
  handleAutoArrange()
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
  
  const performSave = async () => {
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

  if (schedule.value) {
    const prevDays = schedule.value.days?.length || 0
    const start = new Date(editForm.value.startDate)
    const end = new Date(editForm.value.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    if (diffDays < prevDays) {
      openConfirm({
        title: '여행 기간 단축',
        message: '여행 기간을 줄이면 일부 보관된 관광지들이 미등록으로 이동할 수 있습니다. 계속하시겠습니까?',
        confirmVariant: 'primary',
        onConfirm: performSave
      })
      return
    }
  }

  await performSave()
}

function onTitleFocus() {
  showCalendar.value = false
}

function handleDelete() {
  openConfirm({
    title: '일정 삭제',
    message: '이 일정을 삭제하시겠습니까?',
    confirmVariant: 'accent',
    onConfirm: async () => {
      try {
        await scheduleApi.delete(schedule.value.scheduleId)
        showToast('일정이 삭제되었습니다.', 'success')
        router.push('/schedules')
      } catch {
        showToast('삭제에 실패했습니다.', 'error')
      }
    }
  })
}

// 드래그앤드롭 변경 감지(Dirty Check)용 상태
let dragStartState = null
let reorderTimer = null

function onDragStart() {
  hasShownLimitWarning = false
  if (!schedule.value?.days) return
  // 드래그 시작 시점의 days 및 미등록 노드 배열 구조 캡처
  dragStartState = JSON.stringify({
    days: schedule.value.days.map(d => ({
      date: d.date,
      nodeIds: d.nodes.map(n => n.nodeId)
    })),
    unscheduled: (schedule.value.unscheduledNodes || []).map(n => n.nodeId)
  })
}

// 드래그 종료 시 배치 저장 (2초 디바운스 + 오버레이)
function onDragEnd() {
  hasShownLimitWarning = false
  if (!schedule.value?.days) return

  // visitOrder 순차 세팅
  schedule.value.days.forEach(d => {
    d.nodes.forEach((n, i) => { n.visitOrder = i + 1 })
  })

  // 변경 감지 (미등록 노드 포함)
  const currentState = JSON.stringify({
    days: schedule.value.days.map(d => ({
      date: d.date,
      nodeIds: d.nodes.map(n => n.nodeId)
    })),
    unscheduled: (schedule.value.unscheduledNodes || []).map(n => n.nodeId)
  })
  if (dragStartState === currentState) return

  // 기존 타이머 취소 (연속 드래그 시 마지막 것만 실행)
  if (reorderTimer) clearTimeout(reorderTimer)

  // 2초 디바운스 후 저장 요청 + 오버레이
  reorderTimer = setTimeout(async () => {
    isReordering.value = true
    try {
      await scheduleApi.savePlacement(
        schedule.value.scheduleId,
        schedule.value.days.map(d => ({
          date: d.date,
          nodes: d.nodes.map((n, i) => ({ nodeId: n.nodeId, visitOrder: i + 1 }))
        })),
        (schedule.value.unscheduledNodes || []).map((n) => ({
          nodeId: n.nodeId,
          visitOrder: null,
          visitDate: null
        }))
      )
      showToast('순서가 저장되었습니다.', 'success')
      await loadDetail()
    } catch (err) {
      showToast(err?.response?.data?.message || '저장에 실패했습니다.', 'error')
      await loadDetail()
    } finally {
      isReordering.value = false
    }
  }, 2000)
}

// Map
let kakaoMapInstance = null
const currentOverlays = ref([])

watch(schedule, (newVal) => {
  if (newVal && !newVal.unscheduledNodes) {
    newVal.unscheduledNodes = []
  }
}, { immediate: true })

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

  // Polyline: 일차별 간선 경로 그리기
  const nodePositionMap = {} // nodeId → LatLng
  activeNodes.forEach(n => {
    nodePositionMap[n.nodeId] = new window.kakao.maps.LatLng(n.latitude, n.longitude)
  })

  const daysToRender = selectedDay.value
    ? schedule.value.days.filter(d => d.date === selectedDay.value)
    : schedule.value.days

  daysToRender.forEach(day => {
    if (!day.edges?.length) return
    const color = getDayColor(day.date)

    day.edges.forEach(edge => {
      const from = nodePositionMap[edge.fromNodeId]
      const to = nodePositionMap[edge.toNodeId]
      if (!from || !to) return

      const polyline = new window.kakao.maps.Polyline({
        path: [from, to],
        strokeWeight: 3,
        strokeColor: color,
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
      })
      polyline.setMap(map)
      currentOverlays.value.push(polyline)
    })
  })

  if (activeNodes.length > 1) {
    map.setBounds(bounds)
  } else {
    map.setCenter(center)
  }
}

// Voice — AI 명령 API 연동
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ko-KR'
    utter.rate = 1.1
    window.speechSynthesis.speak(utter)
  }
}

async function handleVoice() {
  if (isListening.value) { voiceSearch.stopListening(); isListening.value = false; return }

  // 일차 미선택 시 안내
  if (!selectedDay.value) {
    const msg = '음성 명령을 사용하려면 먼저 일차를 선택해주세요.'
    showToast(msg, 'warning')
    speakText(msg)
    return
  }

  isListening.value = true
  try {
    const { raw } = await voiceSearch.listenAndParse()
    showToast(`🎤 "${raw}"`, 'info')

    // AI 명령 API 호출
    const { data: res } = await scheduleApi.aiCommand(schedule.value.scheduleId, {
      date: selectedDay.value,
      text: raw,
      apply: true,
    })

    const result = res.data
    // AI 응답 메시지 표시 (토스트 + 음성)
    if (result.assistantMessage) {
      showToast(result.assistantMessage, 'success')
      speakText(result.assistantMessage)
    }

    // 반환된 스케줄 데이터로 화면 갱신
    if (result.schedule) {
      schedule.value = result.schedule
    }
  } catch (err) {
    const errMsg = err?.response?.data?.message || '음성 명령 처리에 실패했습니다.'
    showToast(errMsg, 'error')
    speakText(errMsg)
  } finally { isListening.value = false }
}

function goToAttractionDetail(node) {
  router.push(`/attraction/${node.attractionId}`)
}
</script>

<style scoped>
.state-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; gap: 1rem; text-align: center; }

.hero { width: 100%; }
.hero__img { width: 100%; aspect-ratio: 16/9; max-height: 480px; object-fit: cover; display: block; }

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

.info-bar-view__actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.info-bar-view__actions :deep(button) {
  padding: 0.3rem 0.5rem !important;
  font-size: 0.7rem !important;
  height: auto !important;
}

@media (max-width: 767px) {
  .info-bar-view {
    flex-wrap: wrap;
  }
  .info-bar-view__content {
    width: 100%;
  }
  .info-bar-view__actions {
    width: 100%;
    margin-top: 0.5rem;
  }
}


.info-bar-container {
  margin-bottom: 1.25rem;
  background: var(--color-on-primary);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem; 
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

/* Route section */
.route-section { margin-bottom: 0.75rem; }
.route-bar { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.route-btn {
  display: flex; align-items: center; gap: 0.375rem; padding: 0.4rem 0.625rem;
  border-radius: var(--radius-DEFAULT); font-size: var(--font-size-xs); font-weight: 600;
  border: 1.5px solid var(--color-outline-variant); background: var(--color-surface-container-lowest);
  color: var(--color-on-surface-variant); cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.route-btn__label { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.3; }
.route-btn__label small { font-size: 0.625rem; font-weight: 500; color: var(--color-outline); }
.route-btn--active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
.route-btn--auto { border-color: var(--color-accent); color: var(--color-accent); }
.route-btn--auto:hover:not(:disabled) { background: rgba(254,137,106,.1); }
.route-btn--auto:disabled { opacity: 0.45; cursor: not-allowed; }
.route-btn-group { display: flex; align-items: center; gap: 0.25rem; }

/* Auto tooltip */
.auto-tooltip-wrap { position: relative; display: inline-flex; align-items: center; }
.auto-info-icon { font-size: 1rem; color: var(--color-outline); cursor: help; }
.auto-tooltip {
  display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: var(--color-on-surface); color: var(--color-surface); font-size: var(--font-size-xs); font-weight: 600;
  padding: 0.375rem 0.625rem; border-radius: var(--radius-sm); white-space: nowrap; z-index: 50;
}
@media (max-width: 767px) {
  .auto-tooltip {
    left: -102px;
    transform: none;
    white-space: normal;
    width: 220px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
.auto-tooltip-wrap:hover .auto-tooltip { display: block; }

/* Auto guide banner */
.auto-guide-banner {
  display: flex; align-items: flex-start; gap: 0.625rem;
  padding: 0.75rem 1rem; margin-bottom: 0.625rem;
  background: var(--color-primary-soft); border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-DEFAULT);
}
.auto-guide-banner__text { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.auto-guide-banner__text strong { font-size: var(--font-size-sm); color: var(--color-on-surface); }
.auto-guide-banner__text span { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.auto-guide-banner__close { background: none; border: none; cursor: pointer; color: var(--color-outline); padding: 0.125rem; border-radius: var(--radius-sm); }
.auto-guide-banner__close:hover { background: rgba(0,0,0,.05); }

/* Processing overlay */
.node-list-wrapper {
  position: relative;
}
.processing-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 10;
  background: rgba(255,255,255,.75); backdrop-filter: blur(2px);
  border-radius: var(--radius-DEFAULT);
}
.processing-spinner {
  position: sticky; top: 50vh; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem; 
}

/* Day header */
.day-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.25rem;
  font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary-deep); padding: 1.5rem 0 0.25rem;
}
.day-header__routes { display: flex; gap: 0.25rem; }
.edge-connector__info {
  display: flex; align-items: center; gap: 0.25rem;
  background: var(--color-surface); padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;
  color: var(--color-on-surface-variant); z-index: 2;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.edge-connector__info--empty {
  box-shadow: none;
  background: var(--color-surface-container-lowest);
  border: 1px dashed var(--color-outline-variant);
}
.day-route-btn {
  display: inline-flex; align-items: center; gap: 0.15rem;
  padding: 0.15rem 0.4rem; border-radius: var(--radius-sm);
  font-size: 0.65rem; font-weight: 600;
  border: 1px solid var(--color-outline-variant); background: var(--color-surface);
  color: var(--color-on-surface-variant); cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.day-route-btn--active {
  border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft);
}
.day-route-btn:hover { border-color: var(--color-primary); }

/* Edge connector */
.edge-connector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0;
}
.node-list .edge-connector {
  padding-left: 55px;
}
.sidebar-list .edge-connector {
  padding-left: 25px;
}
.edge-connector__line {
  width: 2px;
  align-self: stretch;
  border-left: 2px solid var(--color-outline);
  flex-shrink: 0;
  min-height: 1.5rem;
}
.edge-connector__info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.725rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  background-color: var(--color-primary-soft);
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid var(--color-outline-variant);
  margin: 0.5rem 0;
}
.edge-connector__dot {
  color: var(--color-outline);
}

.node-item-wrap + .node-item-wrap {
  margin-top: 0.5rem;
}
.node-item-wrap + .node-item-wrap:has(.edge-connector) {
  margin-top: 0;
}

/* Node card */
.node-list { display: flex; flex-direction: column; min-height: 2rem; }
.unsched-section .node-list {
  gap: 0.5rem;
}
.empty-dropzone {
  padding: 1.5rem; margin: 0.25rem 0;
  background-color: var(--color-surface-container-low); color: var(--color-outline);
  border: 1px dashed var(--color-outline-variant); font-size: 0.8rem;
  text-align: center; border-radius: var(--radius-md); font-weight: 500;
}
.empty-dropzone--unsched {
  margin-top: 0.5rem;
}
.node-card {
  display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 0.875rem;
  border-radius: var(--radius-DEFAULT); border: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest); transition: border-color 0.15s;
  flex-wrap: wrap;
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
.node-card__addr { display: block; font-size: var(--font-size-xs); color: var(--color-on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.node-card__type { font-size: var(--font-size-xs); color: var(--color-on-surface-variant); }
.node-card__del { background: none; border: none; cursor: pointer; color: var(--color-outline); padding: 0.25rem; border-radius: 50%; transition: color 0.15s; }
.node-card__del:hover { color: var(--color-error); }

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

@media (max-width: 767px) {
  .node-card {
    flex-wrap: wrap;
  }
  .node-card__info {
    flex: 1;
    min-width: 0;
  }
  .node-card__addr {
    font-size: 0.65rem;
    max-width: 100%;
  }
  .node-card__actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.25rem;
    padding-top: 0.375rem;
    border-top: 1px solid var(--color-outline-variant);
  }
}


/* Unsched */
.unsched-section { margin-top: 1.25rem; }
.unsched-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.unsched-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface-variant); display: flex; align-items: center; gap: 0.25rem; margin: 0; }

/* Add place button */
.add-place-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.3rem 0.625rem; border-radius: var(--radius-full);
  font-size: var(--font-size-xs); font-weight: 700;
  border: 1.5px solid var(--color-primary); background: var(--color-primary-soft);
  color: var(--color-primary-deep); cursor: pointer; transition: all 0.15s;
}
.add-place-btn:hover { background: var(--color-primary); color: var(--color-on-primary); }
.add-place-btn--lg { padding: 0.5rem 1rem; font-size: var(--font-size-sm); margin-top: 0.5rem; }

.node-empty { text-align: center; padding: 2rem; font-size: var(--font-size-sm); color: var(--color-on-surface-variant); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.node-empty p { margin: 0; }

/* Map */
.map-view-layout {
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  height: auto;
}

@media (min-width: 768px) {
  .map-view-layout {
    flex-direction: row;
    height: calc(100vh - 180px);
    min-height: 750px;
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

@media (max-width: 767px) {
  .map-view-sidebar {
    height: 720px;
    flex: none;
  }
}

@media (min-width: 768px) {
  .map-view-sidebar {
    max-width: 400px;
    flex: 0 0 400px;
  }
}

.sidebar-title {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-on-surface);
  margin-bottom: 0.5rem;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: 4px;
}
.sidebar-list > * + * {
  margin-top: 0.75rem;
}
.sidebar-list > .edge-connector + .map-sidebar-card {
  margin-top: 0;
}
.sidebar-list > .map-sidebar-card + .edge-connector {
  margin-top: 0;
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
  min-height: auto;
}

.map-sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--color-outline);
}

.map-sidebar-card__order {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
    height: 300px;
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
  padding: 0rem 0.25rem 0.25rem;
  border-bottom: 2px solid var(--color-primary-100);
  /* margin-bottom: 0.5rem; */
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

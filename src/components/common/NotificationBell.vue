<template>
  <div class="notif-wrap" ref="wrapRef">
    <!-- 벨 버튼 -->
    <button class="notif-bell" aria-label="알림" @click="togglePanel">
      <span class="material-symbols-outlined notif-bell__icon">notifications</span>
      <span v-if="notificationStore.hasUnread" class="notif-bell__badge">
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </button>

    <!-- 드롭다운 패널 -->
    <transition name="notif-drop">
      <div v-if="isOpen" class="notif-panel">
        <!-- 패널 헤더 -->
        <div class="notif-panel__header">
          <h3 class="notif-panel__title">
            <span class="material-symbols-outlined" style="font-size:1.15rem;">notifications</span>
            알림
          </h3>
          <span class="notif-panel__count">{{ notificationStore.unreadCount }}개 읽지 않음</span>
        </div>

        <!-- 로딩 -->
        <div v-if="notificationStore.isLoading" class="notif-panel__loading">
          <span class="material-symbols-outlined spin-icon">progress_activity</span>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="notificationStore.notifications.length === 0" class="notif-panel__empty">
          <span class="material-symbols-outlined" style="font-size:2rem;color:var(--color-outline);">notifications_off</span>
          <p>새로운 알림이 없습니다.</p>
        </div>

        <!-- 알림 목록 -->
        <ul v-else class="notif-panel__list">
          <li
            v-for="n in notificationStore.notifications"
            :key="n.notificationId"
            :class="['notif-item', { 'notif-item--unread': !n.read }]"
            @click="handleClick(n)"
          >
            <div :class="['notif-item__icon', `notif-item__icon--${getTypeColor(n.type)}`]">
              <span class="material-symbols-outlined">{{ getTypeIcon(n.type) }}</span>
            </div>
            <div class="notif-item__body">
              <div class="notif-item__row">
                <span class="notif-item__title">{{ n.title }}</span>
                <span class="notif-item__time">{{ formatTime(n.createdAt) }}</span>
              </div>
              <p class="notif-item__text">{{ n.body }}</p>

              <!-- 보호자 요청 액션 -->
              <div v-if="n.type === 'CAREGIVER_REQUEST' && !n.read" class="notif-item__actions">
                <button class="notif-act notif-act--accept" @click.stop="handleAccept(n)">
                  <span class="material-symbols-outlined" style="font-size:0.85rem;">check</span> 수락
                </button>
                <button class="notif-act notif-act--reject" @click.stop="handleReject(n)">
                  <span class="material-symbols-outlined" style="font-size:0.85rem;">close</span> 거절
                </button>
              </div>
            </div>
            <button class="notif-item__del" @click.stop="handleDelete(n)" aria-label="삭제">
              <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
            </button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'
import { useCaregiverStore } from '@/stores/caregiverStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const notificationStore = useNotificationStore()
const caregiverStore = useCaregiverStore()
const authStore = useAuthStore()

const isOpen = ref(false)
const wrapRef = ref(null)

onMounted(() => {
  if (authStore.isAuthenticated) {
    notificationStore.fetchUnreadCount()
  }
  document.addEventListener('click', handleOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutside)
})

function handleOutside(e) {
  if (isOpen.value && wrapRef.value && !wrapRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    notificationStore.fetchNotifications()
    notificationStore.fetchUnreadCount()
  }
}

function getTypeIcon(type) {
  const m = { CAREGIVER_REQUEST: 'person_add', CAREGIVER_ACCEPTED: 'how_to_reg', ARRIVAL: 'location_on' }
  return m[type] || 'notifications'
}

function getTypeColor(type) {
  const m = { CAREGIVER_REQUEST: 'primary', CAREGIVER_ACCEPTED: 'success', ARRIVAL: 'accent' }
  return m[type] || 'default'
}

function formatTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

async function handleClick(n) {
  if (!n.read) await notificationStore.markAsRead(n.notificationId)

  // ARRIVAL 타입이면 도착 상세 페이지로 이동
  if (n.type === 'ARRIVAL' && n.referenceId) {
    isOpen.value = false
    router.push(`/arrival/${n.referenceId}`)
  }
}

async function handleAccept(n) {
  await caregiverStore.acceptRequest(n.referenceId)
  await notificationStore.markAsRead(n.notificationId)
  await notificationStore.fetchNotifications()
}

async function handleReject(n) {
  await caregiverStore.rejectRequest(n.referenceId)
  await notificationStore.markAsRead(n.notificationId)
  await notificationStore.fetchNotifications()
}

async function handleDelete(n) {
  await notificationStore.removeNotification(n.notificationId)
}
</script>

<style scoped>
.notif-wrap {
  position: relative;
}

/* ─── 벨 버튼 ─────────────────────────────── */
.notif-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  transition: background 0.2s;
}
.notif-bell:hover { background: var(--color-surface-container); }

.notif-bell__icon {
  font-size: 26px;
  color: var(--color-on-surface-variant);
  transition: color 0.2s;
}
.notif-bell:hover .notif-bell__icon { color: var(--color-primary); }

.notif-bell__badge {
  position: absolute;
  top: 4px; right: 2px;
  min-width: 18px; height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--color-error);
  color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* ─── 드롭다운 패널 ───────────────────────── */
.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 480px;
  background: var(--color-surface-container-lowest);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
  z-index: 500;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 480px) {
  .notif-panel {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    width: 100%;
    max-height: calc(100dvh - var(--header-height) - var(--bottom-nav-height) - 16px);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
}

/* 트랜지션 */
.notif-drop-enter-active,
.notif-drop-leave-active {
  transition: opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.notif-drop-enter-from,
.notif-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

/* ─── 패널 헤더 ───────────────────────────── */
.notif-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1.5px solid var(--color-outline-variant);
  background: var(--color-surface-container-lowest);
  flex-shrink: 0;
}
.notif-panel__title {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-on-surface); margin: 0;
}
.notif-panel__title .material-symbols-outlined { color: var(--color-primary); }
.notif-panel__count {
  font-size: var(--font-size-xs); font-weight: 600;
  color: var(--color-on-surface-variant);
}

/* ─── 로딩 / 빈 상태 ─────────────────────── */
.notif-panel__loading {
  display: flex; justify-content: center; padding: 2.5rem;
}
.spin-icon { animation: spin 0.8s linear infinite; color: var(--color-primary); font-size: 1.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.notif-panel__empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 2.5rem 1rem;
  text-align: center; color: var(--color-on-surface-variant);
  font-size: var(--font-size-sm);
}

/* ─── 알림 목록 ───────────────────────────── */
.notif-panel__list {
  list-style: none; margin: 0; padding: 0;
  overflow-y: auto; flex: 1;
}

.notif-item {
  position: relative;
  display: flex; gap: 0.625rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-outline-variant);
  transition: background 0.15s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--color-surface-container-low); }
.notif-item--unread { background: var(--color-primary-container); }
.notif-item--unread:hover { background: var(--color-primary-soft); }

.notif-item__icon {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.notif-item__icon .material-symbols-outlined { font-size: 1rem; color: #fff; }
.notif-item__icon--primary { background: var(--gradient-primary); }
.notif-item__icon--success { background: linear-gradient(135deg, #34d399, #059669); }
.notif-item__icon--accent { background: var(--gradient-accent); }
.notif-item__icon--default { background: var(--color-outline); }

.notif-item__body { flex: 1; min-width: 0; }
.notif-item__row {
  display: flex; align-items: center; gap: 0.375rem;
  margin-bottom: 0.125rem;
}
.notif-item__title {
  font-size: var(--font-size-xs); font-weight: 700;
  color: var(--color-on-surface);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.notif-item__time {
  margin-left: auto; flex-shrink: 0;
  font-size: 11px; color: var(--color-outline);
}
.notif-item__text {
  font-size: var(--font-size-xs); color: var(--color-on-surface-variant);
  line-height: 1.4; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 보호자 요청 액션 */
.notif-item__actions { display: flex; gap: 0.35rem; margin-top: 0.5rem; }
.notif-act {
  display: flex; align-items: center; gap: 0.1rem;
  padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);
  border: 1.5px solid; font-size: 11px; font-weight: 700;
  cursor: pointer; transition: all 0.15s; background: none;
}
.notif-act--accept {
  color: var(--color-primary-deep); border-color: var(--color-primary);
}
.notif-act--accept:hover { background: var(--color-primary-soft); }
.notif-act--reject {
  color: var(--color-error-deep); border-color: var(--color-error);
}
.notif-act--reject:hover { background: var(--color-error-container); }

/* 삭제 버튼 */
.notif-item__del {
  position: absolute; top: 6px; right: 6px;
  width: 24px; height: 24px; border-radius: 50%;
  border: none; background: none;
  color: var(--color-outline);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
  opacity: 0;
}
.notif-item:hover .notif-item__del { opacity: 1; }
.notif-item__del:hover {
  background: var(--color-error-container); color: var(--color-error-deep);
}
</style>

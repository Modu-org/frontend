import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '@/api/notificationApi'
import { useToast } from '@/composables/useToast'

export const useNotificationStore = defineStore('notification', () => {
  const { showToast } = useToast()

  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  const hasUnread = computed(() => unreadCount.value > 0)

  /** GET /notifications */
  async function fetchNotifications() {
    isLoading.value = true
    try {
      const { data: res } = await notificationApi.getAll()
      notifications.value = res.data || []
    } catch {
      notifications.value = []
    } finally {
      isLoading.value = false
    }
  }

  /** GET /notifications/unread-count */
  async function fetchUnreadCount() {
    try {
      const { data: res } = await notificationApi.getUnreadCount()
      unreadCount.value = res.data ?? 0
    } catch {
      unreadCount.value = 0
    }
  }

  /** PATCH /notifications/{id}/read */
  async function markAsRead(notificationId) {
    try {
      await notificationApi.markAsRead(notificationId)
      const item = notifications.value.find(n => n.notificationId === notificationId)
      if (item && !item.read) {
        item.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {
      showToast('알림 읽음 처리에 실패했습니다.', 'error')
    }
  }

  /** DELETE /notifications/{id} */
  async function removeNotification(notificationId) {
    try {
      await notificationApi.remove(notificationId)
      const idx = notifications.value.findIndex(n => n.notificationId === notificationId)
      if (idx !== -1) {
        const item = notifications.value[idx]
        if (!item.read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(idx, 1)
      }
      showToast('알림이 삭제되었습니다.', 'success')
    } catch {
      showToast('알림 삭제에 실패했습니다.', 'error')
    }
  }

  /** FCM 포그라운드 수신 시 호출 */
  function onNewNotification() {
    fetchUnreadCount()
    fetchNotifications()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    removeNotification,
    onNewNotification,
  }
})

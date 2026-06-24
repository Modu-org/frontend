import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 앱 마운트 전에 세션 복원 시도 (httpOnly 쿠키 기반)
import { useAuthStore } from './stores/authStore'
const authStore = useAuthStore()
authStore.tryRestoreSession().finally(async () => {
  app.mount('#app')

  // ─── FCM 서비스 워커 등록 & 토큰 저장 ───────────
  let swRegistration = null
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })
      // 서비스 워커 업데이트 확인
      swRegistration.update().catch(() => {})
    } catch (e) {
      console.warn('FCM 서비스 워커 등록 실패:', e)
    }
  }

  // 로그인 상태라면 FCM 토큰 저장 + 포그라운드 알림 리스너 등록
  if (authStore.isAuthenticated) {
    initFcm(swRegistration)
  }
})

async function initFcm(swRegistration) {
  try {
    const { requestFcmToken, onForegroundMessage } = await import('./firebase')
    const { fcmApi } = await import('./api/fcmApi')
    const { useNotificationStore } = await import('./stores/notificationStore')

    const token = await requestFcmToken(swRegistration)
    if (token) {
      await fcmApi.saveToken(token).catch(() => {})
    }

    // 포그라운드 알림 수신 시 알림 스토어 갱신
    const notificationStore = useNotificationStore()
    onForegroundMessage((payload) => {
      notificationStore.onNewNotification()

      // 브라우저 Notification API로 토스트 표시
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || '새 알림', {
          body: payload.notification?.body || '',
          icon: '/images/favicon.png',
        })
      }
    })
  } catch (e) {
    console.warn('FCM 초기화 실패:', e)
  }
}

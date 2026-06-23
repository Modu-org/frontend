import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyDP8jTfcT5t-YpUR3oRaGd51w2y0xqLJcI",
  authDomain: "ieum-db5db.firebaseapp.com",
  projectId: "ieum-db5db",
  storageBucket: "ieum-db5db.firebasestorage.app",
  messagingSenderId: "690841001881",
  appId: "1:690841001881:web:475c8fd3f54359be367d08"
}

const app = initializeApp(firebaseConfig)

let messaging = null

/**
 * Firebase Messaging 인스턴스를 가져온다.
 * 브라우저 환경에서만 초기화 가능.
 */
function getMessagingInstance() {
  if (!messaging) {
    try {
      messaging = getMessaging(app)
    } catch (e) {
      console.warn('Firebase Messaging 초기화 실패:', e)
    }
  }
  return messaging
}

/**
 * FCM 토큰을 발급받는다.
 * @returns {Promise<string|null>} FCM 디바이스 토큰
 */
export async function requestFcmToken() {
  try {
    const m = getMessagingInstance()
    if (!m) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('알림 권한이 거부되었습니다.')
      return null
    }

    // 서비스 워커 등록 확인
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined
    const token = await getToken(m, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    return token || null
  } catch (e) {
    console.error('FCM 토큰 발급 실패:', e)
    return null
  }
}

/**
 * 포그라운드 메시지 수신 리스너를 등록한다.
 * @param {function} callback - 메시지 수신 시 호출될 콜백
 * @returns {function|null} 구독 해제 함수
 */
export function onForegroundMessage(callback) {
  const m = getMessagingInstance()
  if (!m) return null
  return onMessage(m, callback)
}

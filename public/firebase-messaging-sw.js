importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDP8jTfcT5t-YpUR3oRaGd51w2y0xqLJcI",
  authDomain: "ieum-db5db.firebaseapp.com",
  projectId: "ieum-db5db",
  storageBucket: "ieum-db5db.firebasestorage.app",
  messagingSenderId: "690841001881",
  appId: "1:690841001881:web:475c8fd3f54359be367d08"
});

const messaging = firebase.messaging();

// ─── 백그라운드 메시지 수신 ─────────────────────────
messaging.onBackgroundMessage((payload) => {
  // notification 필드가 있으면 브라우저가 자동 표시하므로 data-only일 때만 처리
  if (payload.notification) return;

  const data = payload.data || {};
  const notificationTitle = data.title || "새 알림";
  const notificationOptions = {
    body: data.body || "알림이 도착했습니다.",
    icon: "/images/icon-192x192.png",
    badge: "/images/icon-192x192.png",
    data: data,
    vibrate: [200, 100, 200],
    tag: data.type || "default",
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── push 이벤트 직접 핸들링 (Safari 호환) ──────────
self.addEventListener("push", (event) => {
  // Firebase SDK가 처리하지 못한 push 이벤트를 직접 처리
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch {
      payload = { data: { title: "새 알림", body: event.data.text() } };
    }

    // Firebase SDK가 이미 처리했으면 중복 방지
    if (payload.notification) return;

    const data = payload.data || payload;
    const title = data.title || "이음 알림";
    const options = {
      body: data.body || "알림이 도착했습니다.",
      icon: "/images/icon-192x192.png",
      badge: "/images/icon-192x192.png",
      data: data,
      vibrate: [200, 100, 200],
      tag: data.type || "default",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// ─── 알림 클릭 시 앱으로 이동 ───────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/";

  // ARRIVAL 타입이면 도착 상세 페이지로 이동
  if (data.type === "ARRIVAL" && data.referenceId) {
    targetUrl = `/arrival/${data.referenceId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // 열린 창이 없으면 새 창 열기
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── PWA 오프라인 캐시 (App Shell) ──────────────────
const CACHE_NAME = "ieum-pwa-v1";
const APP_SHELL = [
  "/",
  "/images/icon-192x192.png",
  "/images/icon-512x512.png",
  "/images/favicon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // API 요청은 네트워크 우선 (캐시 안 함)
  if (event.request.url.includes("/api/")) return;

  // navigation 요청은 네트워크 우선, 실패 시 캐시된 index.html 반환 (SPA)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  // 기타 정적 리소스: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

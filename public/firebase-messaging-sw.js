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

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "새 알림";
  const notificationOptions = {
    body: payload.notification?.body || "알림이 도착했습니다.",
    icon: "/images/favicon.png",
    badge: "/images/favicon.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

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
import('./stores/authStore').then(({ useAuthStore }) => {
  const authStore = useAuthStore()
  authStore.tryRestoreSession().finally(() => {
    app.mount('#app')
  })
}).catch(() => {
  // fallback: 스토어 로드 실패 시에도 앱은 마운트
  app.mount('#app')
})

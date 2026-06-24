<template>
  <DefaultLayout title="도착 정보" show-back>
    <!-- 로딩 -->
    <div v-if="isLoading" class="state-wrap"><LoadingSpinner /></div>

    <!-- 에러 -->
    <div v-else-if="error" class="state-wrap">
      <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-error);">error</span>
      <p class="empty-text">{{ error }}</p>
      <BaseButton size="sm" @click="router.back()">돌아가기</BaseButton>
    </div>

    <!-- 데이터 -->
    <template v-else-if="log">
      <!-- 도착 정보 카드 -->
      <section class="arrival-card">
        <div class="arrival-card__header">
          <div :class="['arrival-status', log.arrived ? 'arrival-status--arrived' : 'arrival-status--failed']">
            <span class="material-symbols-outlined">{{ log.arrived ? 'check_circle' : 'cancel' }}</span>
            {{ log.arrived ? '도착 확인됨' : '도착 미확인' }}
          </div>
          <span class="arrival-card__time">{{ formatDateTime(log.requestedAt) }}</span>
        </div>

        <div class="arrival-card__body">
          <h2 class="arrival-card__name">{{ log.attractionName }}</h2>
          <p class="arrival-card__addr">
            <span class="material-symbols-outlined" style="font-size:0.9rem;">location_on</span>
            {{ log.address }}
          </p>
          <div v-if="log.distanceMeters != null" class="arrival-card__distance">
            <span class="material-symbols-outlined" style="font-size:0.9rem;">straighten</span>
            도착 지점까지 거리: <strong>{{ formatDistance(log.distanceMeters) }}</strong>
          </div>
        </div>
      </section>

      <!-- 지도 -->
      <section class="map-section">
        <div ref="mapContainer" class="map-container"></div>
      </section>

      <!-- 다음 관광지 -->
      <section v-if="log.nextDestination" class="next-section">
        <h3 class="next-section__title">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_forward</span>
          다음 관광지
        </h3>
        <div class="next-card">
          <div class="next-card__info">
            <span class="next-card__name">{{ log.nextDestination.placeName }}</span>
            <span class="next-card__addr">{{ log.nextDestination.address }}</span>
          </div>
          <div class="next-card__meta">
            <span class="next-card__chip">
              <span class="material-symbols-outlined" style="font-size:0.85rem;">directions_car</span>
              {{ formatDuration(log.nextDestination.estimatedTimeMinutes) }}
            </span>
            <span class="next-card__chip">
              <span class="material-symbols-outlined" style="font-size:0.85rem;">straighten</span>
              {{ formatDistance(log.nextDestination.distanceMeters) }}
            </span>
          </div>
        </div>
      </section>

      <section v-else class="next-section">
        <div class="next-empty">
          <span class="material-symbols-outlined" style="font-size:2rem;color:var(--color-outline);">flag</span>
          <p>마지막 관광지입니다. 다음 도착지가 없습니다.</p>
        </div>
      </section>
    </template>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { arrivalApi } from '@/api/arrivalApi'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const log = ref(null)
const isLoading = ref(true)
const error = ref(null)
const mapContainer = ref(null)

onMounted(async () => {
  await loadArrivalLog()
})

async function loadArrivalLog() {
  isLoading.value = true
  error.value = null
  try {
    const { data: res } = await arrivalApi.getArrivalLog(route.params.arrivalLogId)
    log.value = res.data
  } catch (err) {
    error.value = err?.response?.data?.message || '도착 정보를 불러올 수 없습니다.'
  } finally {
    isLoading.value = false
  }

  // isLoading이 false가 되어 템플릿이 렌더링된 후 맵 초기화
  if (log.value) {
    await nextTick()
    await initMap()
  }
}

async function initMap() {
  if (!mapContainer.value || !log.value) return
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key) return

  await new Promise(resolve => {
    if (window.kakao?.maps) { window.kakao.maps.load(resolve); return }
    const s = document.createElement('script')
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    s.onload = () => window.kakao.maps.load(resolve)
    document.head.appendChild(s)
  })

  drawMap()
}

function drawMap() {
  const data = log.value
  const centerLat = data.requestLatitude || data.attractionLatitude
  const centerLng = data.requestLongitude || data.attractionLongitude

  const map = new window.kakao.maps.Map(mapContainer.value, {
    center: new window.kakao.maps.LatLng(centerLat, centerLng),
    level: 5,
  })

  // 도착 요청 위치 마커 (현재 위치)
  if (data.requestLatitude && data.requestLongitude) {
    const reqPos = new window.kakao.maps.LatLng(data.requestLatitude, data.requestLongitude)
    new window.kakao.maps.Marker({
      map,
      position: reqPos,
      title: '도착 확인 위치',
    })

    const reqOverlay = new window.kakao.maps.CustomOverlay({
      position: reqPos,
      content: `<div style="padding:4px 10px;background:#4f46e5;color:#fff;border-radius:8px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);transform:translateY(-42px);">📍 도착 확인 위치</div>`,
      yAnchor: 1,
    })
    reqOverlay.setMap(map)
  }

  // 관광지 위치 마커
  if (data.attractionLatitude && data.attractionLongitude) {
    const attrPos = new window.kakao.maps.LatLng(data.attractionLatitude, data.attractionLongitude)
    new window.kakao.maps.Marker({
      map,
      position: attrPos,
      title: data.attractionName,
    })

    const attrOverlay = new window.kakao.maps.CustomOverlay({
      position: attrPos,
      content: `<div style="padding:4px 10px;background:#059669;color:#fff;border-radius:8px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);transform:translateY(-42px);">🏛️ ${data.attractionName}</div>`,
      yAnchor: 1,
    })
    attrOverlay.setMap(map)
  }

  // 다음 관광지 마커
  const next = data.nextDestination
  if (next?.latitude && next?.longitude) {
    const nextPos = new window.kakao.maps.LatLng(next.latitude, next.longitude)
    new window.kakao.maps.Marker({
      map,
      position: nextPos,
      title: next.placeName,
    })

    const nextOverlay = new window.kakao.maps.CustomOverlay({
      position: nextPos,
      content: `<div style="padding:4px 10px;background:#f59e0b;color:#fff;border-radius:8px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);transform:translateY(-42px);">➡️ ${next.placeName}</div>`,
      yAnchor: 1,
    })
    nextOverlay.setMap(map)
  }

  // 모든 마커가 보이도록 bounds 조정
  const bounds = new window.kakao.maps.LatLngBounds()
  if (data.requestLatitude) bounds.extend(new window.kakao.maps.LatLng(data.requestLatitude, data.requestLongitude))
  if (data.attractionLatitude) bounds.extend(new window.kakao.maps.LatLng(data.attractionLatitude, data.attractionLongitude))
  if (next?.latitude) bounds.extend(new window.kakao.maps.LatLng(next.latitude, next.longitude))
  map.setBounds(bounds)
}

function formatDateTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDistance(meters) {
  if (meters == null) return ''
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatDuration(mins) {
  if (mins == null) return ''
  if (mins < 60) return `${mins}분`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}
</script>

<style scoped>
.state-wrap {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 3rem 1rem; gap: 0.75rem; text-align: center;
}
.empty-text { font-size: var(--font-size-body); font-weight: 600; color: var(--color-on-surface); }

/* ─── 도착 카드 ───────────────────── */
.arrival-card {
  background: var(--color-surface-container-lowest);
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 1rem;
}
.arrival-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-outline-variant);
}
.arrival-card__time {
  font-size: var(--font-size-xs); color: var(--color-on-surface-variant);
}

.arrival-status {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: var(--font-size-sm); font-weight: 700;
  border-radius: var(--radius-full); padding: 0.25rem 0.75rem;
}
.arrival-status--arrived {
  background: #d1fae5; color: #065f46;
}
.arrival-status--failed {
  background: #fee2e2; color: #991b1b;
}

.arrival-card__body { padding: 1rem; }
.arrival-card__name {
  font-size: var(--font-size-lg); font-weight: 700;
  color: var(--color-on-surface); margin: 0 0 0.375rem;
}
.arrival-card__addr {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: var(--font-size-sm); color: var(--color-on-surface-variant); margin: 0 0 0.5rem;
}
.arrival-card__distance {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: var(--font-size-sm); color: var(--color-on-surface-variant);
}

/* ─── 지도 ────────────────────────── */
.map-section { margin-bottom: 1rem; }
.map-container {
  width: 100%; height: 320px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-outline-variant);
  overflow: hidden;
}

/* ─── 다음 관광지 ─────────────────── */
.next-section { margin-bottom: 1.5rem; }
.next-section__title {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-on-surface); margin: 0 0 0.625rem;
}

.next-card {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-DEFAULT);
  border: 1.5px solid var(--color-primary);
  background: var(--color-primary-soft);
}
.next-card__info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.next-card__name {
  font-size: var(--font-size-sm); font-weight: 700; color: var(--color-on-surface);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.next-card__addr {
  font-size: var(--font-size-xs); color: var(--color-on-surface-variant);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.next-card__meta { display: flex; gap: 0.375rem; flex-shrink: 0; flex-wrap: wrap; }
.next-card__chip {
  display: flex; align-items: center; gap: 0.15rem;
  padding: 0.2rem 0.5rem; border-radius: var(--radius-full);
  background: var(--color-primary-100); color: var(--color-primary-deep);
  font-size: var(--font-size-xs); font-weight: 600;
}

.next-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 2rem; text-align: center;
  color: var(--color-on-surface-variant); font-size: var(--font-size-sm);
  border: 1.5px dashed var(--color-outline-variant); border-radius: var(--radius-lg);
}
</style>

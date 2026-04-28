import { ref, onMounted, onUnmounted, shallowRef } from 'vue'

/**
 * 카카오맵 API composable
 * SDK를 동적 로딩하고 지도 인스턴스를 관리합니다.
 */
export function useKakaoMap() {
  const mapInstance = shallowRef(null)
  const markers = ref([])
  const isLoaded = ref(false)

  /** 카카오맵 SDK 동적 로드 */
  function loadScript() {
    return new Promise((resolve, reject) => {
      if (window.kakao?.maps) {
        resolve()
        return
      }

      const key = import.meta.env.VITE_KAKAO_MAP_KEY
      if (!key) {
        reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다.'))
        return
      }

      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services,clusterer`
      script.onload = () => {
        window.kakao.maps.load(() => {
          isLoaded.value = true
          resolve()
        })
      }
      script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'))
      document.head.appendChild(script)
    })
  }

  /** 지도 초기화 */
  async function initMap(container, options = {}) {
    await loadScript()

    const { kakao } = window
    const mapOptions = {
      center: new kakao.maps.LatLng(options.lat || 37.5665, options.lng || 126.978),
      level: options.level || 5,
    }

    mapInstance.value = new kakao.maps.Map(container, mapOptions)
    return mapInstance.value
  }

  /** 마커 추가 */
  function addMarker(lat, lng, options = {}) {
    if (!mapInstance.value) return null

    const { kakao } = window
    const position = new kakao.maps.LatLng(lat, lng)
    const marker = new kakao.maps.Marker({
      map: mapInstance.value,
      position,
      title: options.title || '',
    })

    if (options.onClick) {
      kakao.maps.event.addListener(marker, 'click', () => options.onClick(marker))
    }

    markers.value.push(marker)
    return marker
  }

  /** 인포윈도우 추가 */
  function addInfoWindow(marker, content) {
    if (!mapInstance.value) return null

    const { kakao } = window
    const infoWindow = new kakao.maps.InfoWindow({ content })
    kakao.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(mapInstance.value, marker)
    })
    return infoWindow
  }

  /** 모든 마커가 보이도록 영역 조절 */
  function fitBounds() {
    if (!mapInstance.value || markers.value.length === 0) return

    const { kakao } = window
    const bounds = new kakao.maps.LatLngBounds()
    markers.value.forEach((marker) => {
      bounds.extend(marker.getPosition())
    })
    mapInstance.value.setBounds(bounds)
  }

  /** 마커 전체 제거 */
  function clearMarkers() {
    markers.value.forEach((m) => m.setMap(null))
    markers.value = []
  }

  /** 폴리라인(경로) 그리기 */
  function drawRoute(coordinates, options = {}) {
    if (!mapInstance.value) return null

    const { kakao } = window
    const path = coordinates.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng))
    const polyline = new kakao.maps.Polyline({
      map: mapInstance.value,
      path,
      strokeWeight: options.weight || 4,
      strokeColor: options.color || '#1A90D9',
      strokeOpacity: options.opacity || 0.8,
      strokeStyle: 'solid',
    })
    return polyline
  }

  onUnmounted(() => {
    clearMarkers()
    mapInstance.value = null
  })

  return {
    mapInstance,
    markers,
    isLoaded,
    initMap,
    addMarker,
    addInfoWindow,
    fitBounds,
    clearMarkers,
    drawRoute,
  }
}

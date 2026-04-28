<template>
  <div
    ref="mapContainer"
    :class="['w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-light)]', containerClass]"
    :style="{ height: height }"
    role="application"
    aria-label="지도"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useKakaoMap } from '@/composables/useKakaoMap'

const props = defineProps({
  height: { type: String, default: '400px' },
  containerClass: { type: String, default: '' },
  markers: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.5665, lng: 126.978 }) },
  level: { type: Number, default: 5 },
})

const mapContainer = ref(null)
const { initMap, addMarker, clearMarkers, fitBounds } = useKakaoMap()

onMounted(async () => {
  if (mapContainer.value) {
    await initMap(mapContainer.value, {
      lat: props.center.lat,
      lng: props.center.lng,
      level: props.level,
    })
    renderMarkers()
  }
})

watch(() => props.markers, renderMarkers, { deep: true })

function renderMarkers() {
  clearMarkers()
  props.markers.forEach((m) => {
    addMarker(m.lat, m.lng, { title: m.title, onClick: m.onClick })
  })
  if (props.markers.length > 1) fitBounds()
}
</script>

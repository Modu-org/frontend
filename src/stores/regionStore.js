import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { regionApi } from '@/api/attractionApi'

export const useRegionStore = defineStore('region', () => {
  const regionList = ref([])
  const isLoaded = ref(false)

  /** 시/도 목록 */
  const regions = computed(() => regionList.value)

  /** regionCode로 시/도 찾기 */
  function findRegion(code) {
    return regionList.value.find(r => String(r.regionCode) === String(code)) || null
  }

  /** districtCode로 군구 찾기 */
  function findDistrict(regionCode, districtCode) {
    const region = findRegion(regionCode)
    return region?.districts?.find(d => String(d.districtCode) === String(districtCode)) || null
  }

  /** 앱 시작 시 1회 호출 */
  async function loadOnce() {
    if (isLoaded.value) return
    try {
      const { data: res } = await regionApi.getAll()
      regionList.value = res.data || res || []
      isLoaded.value = true
    } catch {
      // 실패해도 앱은 동작, 재시도 허용
    }
  }

  return { regions, isLoaded, findRegion, findDistrict, loadOnce }
})

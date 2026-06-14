import { defineStore } from 'pinia'

/**
 * 관광지 목록 페이지의 접근성 필터 기본값 적용 여부를 추적하는 스토어.
 *
 * - hasAppliedDefaults: 현재 탐색 세션에서 authStore 기반 기본 접근성 필터를
 *   이미 적용했는지 여부. true면 재진입 시 사용자가 의도적으로 해제한 필터를
 *   다시 켜지 않고 URL 쿼리 파라미터 상태를 그대로 존중한다.
 *
 * - 관광지 영역(목록 ↔ 상세) 내에서는 플래그가 유지되어 필터 상태가 보존된다.
 * - 관광지 영역을 벗어나면 AttractionListPage의 onBeforeRouteLeave에서
 *   reset()을 호출하여 다음 진입 시 기본값이 다시 적용되도록 한다.
 */
export const useAttractionFilterStore = defineStore('attractionFilter', {
  state: () => ({
    hasAppliedDefaults: false,
  }),
  actions: {
    /** 기본 접근성 필터가 적용되었음을 기록한다. */
    markDefaultsApplied() {
      this.hasAppliedDefaults = true
    },
    /** 플래그를 초기화하여 다음 진입 시 기본값이 다시 적용되도록 한다. */
    reset() {
      this.hasAppliedDefaults = false
    },
  },
})

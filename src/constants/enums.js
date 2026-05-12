/**
 * ENUM 상수 — SQL 테이블 + API 명세 기반
 */

/** Age Group (SQL: age_group_code 0~6) */
export const AGE_GROUPS = [
  { code: 0, value: 'none', label: '없음' },
  { code: 1, value: 'teens', label: '10대' },
  { code: 2, value: 'twenties', label: '20대' },
  { code: 3, value: 'thirties', label: '30대' },
  { code: 4, value: 'forties', label: '40대' },
  { code: 5, value: 'fifties', label: '50대' },
  { code: 6, value: 'sixties_plus', label: '60대 이상' },
]

/** 선택 가능한 연령대 (온보딩용 — code 0 '없음' 제외) */
export const AGE_GROUP_OPTIONS = AGE_GROUPS.filter((a) => a.code > 0)

/**
 * UserInfo — 유저 특성 정보 (SQL: TINYINT 0/1)
 * 온보딩 Step 1에서 복수 선택 가능
 */
export const USER_INFO_FIELDS = [
  { key: 'usesWheelchair', label: '휠체어 사용', icon: 'accessible_forward' },
  { key: 'hasStroller', label: '유모차 동반', icon: 'stroller' },
  { key: 'usesWalkingAid', label: '보행 보조기 사용', icon: 'elderly' },
  { key: 'hasServiceDog', label: '안내견 동반', icon: 'pets' },
  { key: 'needsVisualAssistance', label: '시각 지원 필요', icon: 'visibility' },
]

/** Trip Style (SQL: trip_style_code 1~5) */
export const TRIP_STYLES = [
  { code: 1, value: 'RELAXATION', label: '힐링', icon: 'spa' },
  { code: 2, value: 'ACTIVITY', label: '체험', icon: 'hiking' },
  { code: 3, value: 'CULTURE', label: '문화', icon: 'museum' },
  { code: 4, value: 'FOOD', label: '미식', icon: 'restaurant' },
  { code: 5, value: 'SHOPPING', label: '쇼핑', icon: 'shopping_bag' },
]

/** Post Type (SQL: post_type TINYINT 1~4) */
export const POST_TYPES = [
  { code: 1, value: 'DESTINATION_RECOMMENDATION', label: '여행지 추천' },
  { code: 2, value: 'ISSUE_REPORT', label: '여행지 불편사항 제보' },
  { code: 3, value: 'SUGGESTION', label: '건의사항' },
  { code: 4, value: 'OTHER', label: '기타' },
]

/** Node Type (SQL: node_type) */
export const NODE_TYPES = {
  START: 'START',
  ATTRACTION: 'ATTRACTION',
  END: 'END',
}

/** Transport Mode (SQL: transport_mode) */
export const TRANSPORT_MODES = [
  { value: 'WALK', label: '도보', icon: 'directions_walk' },
  { value: 'PUBLIC_TRANSPORT', label: '대중교통', icon: 'directions_bus' },
  { value: 'CAR', label: '자동차', icon: 'directions_car' },
]

/** Content Type (한국관광공사 API content_type_id) */
export const CONTENT_TYPES = [
  { id: '12', value: 'TOURIST_ATTRACTION', label: '관광지' },
  { id: '14', value: 'CULTURAL_FACILITY', label: '문화시설' },
  { id: '15', value: 'FESTIVAL', label: '축제/공연' },
  { id: '25', value: 'TOUR_COURSE', label: '여행코스' },
  { id: '28', value: 'LEPORTS', label: '레포츠' },
  { id: '32', value: 'LODGING', label: '숙박' },
  { id: '38', value: 'SHOPPING', label: '쇼핑' },
  { id: '39', value: 'RESTAURANT', label: '음식점' },
]

export const CONTENT_TYPE_MAP = Object.fromEntries(
  CONTENT_TYPES.map((c) => [c.id, c])
)

/** UI Mode (SQL: ui_mode) */
export const UI_MODES = {
  STANDARD: 'STANDARD',
  SIMPLE: 'SIMPLE',
}

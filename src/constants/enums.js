/**
 * UserDetail — 유저 상세 정보 (SQL: user_detail 테이블)
 * 온보딩에서 체크, 각 TINYINT 0/1
 */
export const USER_DETAIL_FIELDS = [
  { key: 'physical', label: '지체 장애', icon: 'accessible_forward' },
  { key: 'visual', label: '시각 장애', icon: 'visibility' },
  { key: 'hearing', label: '청각 장애', icon: 'hearing' },
  { key: 'infantFamily', label: '유아 동반', icon: 'stroller' },
]

/** Post Type (SQL: post_type TINYINT 0/1) */
export const POST_TYPES = [
  { code: 0, value: 'REVIEW', label: '여행 후기' },
  { code: 1, value: 'REPORT', label: '불편사항 신고' },
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

/**
 * contentTypeId별 기본(fallback) 이미지 경로
 * /public/images/defaults/ 에 위치
 */

const baseUrl = '/images/defaults'
export const CONTENT_TYPE_DEFAULT_IMG = {
  '12': `${baseUrl}/tourist.png`,
  '14': `${baseUrl}/culture.png`,
  '15': `${baseUrl}/festival.png`,
  '25': `${baseUrl}/course.png`,
  '28': `${baseUrl}/sports.png`,
  '32': `${baseUrl}/lodging.png`,
  '38': `${baseUrl}/shopping.png`,
  '39': `${baseUrl}/restaurant.png`,
}

export const FALLBACK_IMG = '/images/defaults/tourist.png'

/** contentTypeId로 기본 이미지 경로를 반환 (없으면 관광지 기본이미지) */
export function getDefaultImg(contentTypeId) {
  return CONTENT_TYPE_DEFAULT_IMG[String(contentTypeId)] ?? FALLBACK_IMG
}

/**
 * 접근성 상수 — SQL accessibility_type/status/category 기반
 */

/** Accessibility Status (SQL: accessibility_status) */
export const ACCESSIBILITY_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  PARTIAL: 'PARTIAL',
  UNKNOWN: 'UNKNOWN',
  NEED_CHECK: 'NEED_CHECK',
}

export const STATUS_LABELS = {
  AVAILABLE: '이용 가능',
  UNAVAILABLE: '이용 불가',
  PARTIAL: '부분 가능',
  UNKNOWN: '정보 없음',
  NEED_CHECK: '확인 필요',
}

/** Accessibility Category (SQL: accessibility_category) */
export const ACCESSIBILITY_CATEGORIES = {
  PHYSICAL: '지체장애',
  VISUAL: '시각장애',
  HEARING: '청각장애',
  INFANT_FAMILY: '영유아/가족',
  COMMON: '공통',
  ETC: '기타',
}

/**
 * accessibilitySummary 키 → 아이콘/라벨 매핑
 * API 응답의 accessibilitySummary 객체 키와 일치
 */
export const ACCESSIBILITY_SUMMARY_FIELDS = [
  { key: 'wheelchair', label: '휠체어', icon: 'accessible' },
  { key: 'stroller', label: '유모차', icon: 'stroller' },
  { key: 'accessibleRestroom', label: '장애인화장실', icon: 'wc' },
  { key: 'elevator', label: '엘리베이터', icon: 'elevator' },
  { key: 'ramp', label: '경사로', icon: 'signal_cellular_alt' },
]

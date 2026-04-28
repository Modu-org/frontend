/**
 * ENUM 상수 (기획서 5.1 테이블 설계 기반)
 */

export const AGE_GROUPS = [
  { value: 'UNDER_10', label: '10대 미만', icon: '👶' },
  { value: '10_20', label: '10~20대', icon: '🧑' },
  { value: '30_40', label: '30~40대', icon: '👨' },
  { value: '50_60', label: '50~60대', icon: '🧓' },
  { value: 'OVER_70', label: '70대 이상', icon: '👴' },
]

export const MOBILITY_AIDS = [
  { value: 'NONE', label: '없음', icon: '🚶' },
  { value: 'MANUAL_WHEELCHAIR', label: '수동 휠체어', icon: '♿' },
  { value: 'ELECTRIC_WHEELCHAIR', label: '전동 휠체어', icon: '🦼' },
  { value: 'WALKING_AID', label: '보행 보조기', icon: '🦯' },
  { value: 'STROLLER', label: '유모차 동반', icon: '🍼' },
]

export const TRAVEL_TYPES = [
  { value: 'SOLO', label: '혼자', icon: '🧍' },
  { value: 'FAMILY', label: '가족', icon: '👨‍👩‍👧' },
  { value: 'FRIENDS', label: '친구', icon: '👫' },
  { value: 'WITH_GUARDIAN', label: '보호자 동반', icon: '🤝' },
]

export const TRIP_DURATIONS = [
  { value: 1, label: '당일치기' },
  { value: 2, label: '1박 2일' },
  { value: 3, label: '2박 3일' },
  { value: 4, label: '3박 이상' },
]

export const BUDGET_RANGES = [
  { value: 50000, label: '5만원 이하' },
  { value: 100000, label: '5~10만원' },
  { value: 200000, label: '10~20만원' },
  { value: 300000, label: '20만원 이상' },
]

export const TRIP_STATUS = {
  DRAFT: '계획 중',
  CONFIRMED: '확정',
  COMPLETED: '완료',
}

export const UI_MODES = {
  STANDARD: 'standard',
  SIMPLE: 'simple',
}

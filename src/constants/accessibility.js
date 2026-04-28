/**
 * 접근성 관련 상수 및 배지 매핑
 */
export const ACCESSIBILITY_BADGES = [
  { key: 'wheelchairAccessible', label: '휠체어', icon: '♿', color: 'primary' },
  { key: 'strollerAccessible', label: '유모차', icon: '🍼', color: 'secondary' },
  { key: 'disabledRestroom', label: '장애인화장실', icon: '🚻', color: 'secondary' },
  { key: 'elevatorAvailable', label: '엘리베이터', icon: '🛗', color: 'secondary' },
  { key: 'rampAvailable', label: '경사로', icon: '↗', color: 'secondary' },
]

/**
 * 이동 보조기기가 필요로 하는 접근성 필드 매핑
 */
export const MOBILITY_ACCESSIBILITY_MAP = {
  MANUAL_WHEELCHAIR: ['wheelchairAccessible'],
  ELECTRIC_WHEELCHAIR: ['wheelchairAccessible'],
  WALKING_AID: ['elevatorAvailable', 'rampAvailable'],
  STROLLER: ['strollerAccessible'],
  NONE: [],
}

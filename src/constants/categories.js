/**
 * 관광 카테고리 (contentTypeId)
 */
export const CATEGORIES = [
  { id: 12, name: '자연관광지', icon: '🏞️', defaultDurationMin: 120 },
  { id: 14, name: '문화/역사', icon: '🏛️', defaultDurationMin: 90 },
  { id: 15, name: '체험', icon: '🎯', defaultDurationMin: 120 },
  { id: 25, name: '여행코스', icon: '🗺️', defaultDurationMin: 180 },
  { id: 28, name: '레포츠', icon: '⛷️', defaultDurationMin: 120 },
  { id: 32, name: '숙박', icon: '🏨', defaultDurationMin: 0 },
  { id: 38, name: '쇼핑', icon: '🛍️', defaultDurationMin: 60 },
  { id: 39, name: '음식점', icon: '🍽️', defaultDurationMin: 60 },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)

/**
 * 여행 테마
 */
export const THEMES = [
  { value: 'NATURE', label: '자연', icon: '🌿' },
  { value: 'CULTURE', label: '문화/역사', icon: '🏛️' },
  { value: 'FOOD', label: '음식', icon: '🍽️' },
  { value: 'EXPERIENCE', label: '체험', icon: '🎯' },
  { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
]

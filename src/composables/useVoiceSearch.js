import { ref, computed } from 'vue'
import { useVoiceInput } from './useVoiceInput'
import { REGIONS } from '@/constants/regions'

/**
 * 음성 인식 결과를 관광지 검색 API 파라미터로 파싱하는 composable
 *
 * 사용 예:
 *   "서울에서 휠체어 이용 가능한 공원 찾아줘"
 *   → { regionCode: '1', keyword: '공원', physical: true }
 *
 *   "부산 유아 동반 가능한 수목원"
 *   → { regionCode: '6', keyword: '수목원', infant_family: true }
 */
export function useVoiceSearch() {
  const {
    isListening, transcript, error, isSupported,
    startListening, stopListening, resetTranscript,
  } = useVoiceInput()

  /** 지역명 → regionCode 매핑 (축약어 포함) */
  const REGION_ALIASES = buildRegionAliases()

  /** 접근성 키워드 → API 파라미터 매핑 */
  const ACCESSIBILITY_KEYWORDS = [
    { keys: ['지체', '휠체어', '경사로', '지체장애', '지체 장애'], param: 'physical' },
    { keys: ['시각', '시각장애', '시각 장애', '점자', '음성 안내'], param: 'visual' },
    { keys: ['청각', '청각장애', '청각 장애', '수어', '수화', '자막'], param: 'hearing' },
    { keys: ['유아', '유모차', '아이', '아기', '유아 동반', '영유아', '어린이'], param: 'infant_family' },
  ]

  /** 제거할 불용어 */
  const STOP_WORDS = [
    '에서', '에', '의', '으로', '로', '을', '를', '이', '가',
    '있는', '가능한', '이용', '가능', '찾아줘', '검색해줘',
    '알려줘', '보여줘', '추천해줘', '관광지', '여행지', '근처',
    '주변', '좋은', '괜찮은', '좀', '해줘', '해', '줘',
  ]

  /** 파싱된 검색 파라미터 (reactive) */
  const parsedParams = computed(() => parseTranscript(transcript.value))

  /**
   * 음성 텍스트 → 검색 API 파라미터 파싱
   */
  function parseTranscript(text) {
    if (!text || !text.trim()) return null

    const result = {
      regionCode: null,
      sigunguCode: null,
      keyword: null,
      physical: false,
      visual: false,
      hearing: false,
      infant_family: false,
    }

    let remaining = text.trim()

    // 1. 지역 추출
    for (const [alias, code] of REGION_ALIASES) {
      if (remaining.includes(alias)) {
        result.regionCode = String(code)
        remaining = remaining.replace(alias, '')
        break
      }
    }

    // 2. 접근성 키워드 추출
    for (const group of ACCESSIBILITY_KEYWORDS) {
      for (const key of group.keys) {
        if (remaining.includes(key)) {
          result[group.param] = true
          remaining = remaining.replace(new RegExp(key, 'g'), '')
          break
        }
      }
    }

    // 3. 불용어 제거 → 남은 텍스트가 keyword
    for (const word of STOP_WORDS) {
      remaining = remaining.replace(new RegExp(word, 'g'), '')
    }

    const keyword = remaining.replace(/\s+/g, ' ').trim()
    if (keyword) {
      result.keyword = keyword
    }

    return result
  }

  /**
   * API 호출용 쿼리 파라미터 객체 생성
   * false/null 값은 제거하여 깔끔한 params 반환
   */
  function toQueryParams(parsed, { page = 0, size = 20 } = {}) {
    if (!parsed) return { page, size }

    const params = { page, size }
    if (parsed.regionCode) params.regionCode = parsed.regionCode
    if (parsed.sigunguCode) params.sigunguCode = parsed.sigunguCode
    if (parsed.keyword) params.keyword = parsed.keyword
    if (parsed.physical) params.physical = true
    if (parsed.visual) params.visual = true
    if (parsed.hearing) params.hearing = true
    if (parsed.infant_family) params.infant_family = true

    return params
  }

  /**
   * 음성 인식 시작 → 종료 후 파싱된 결과 반환하는 Promise
   * 모바일 PWA에서 버튼 한 번으로 사용 가능
   */
  function listenAndParse() {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        reject(new Error('이 브라우저는 음성 인식을 지원하지 않습니다.'))
        return
      }

      const unwatch = computed(() => isListening.value)

      // 인식 종료 감지를 위한 watcher
      const checkEnd = setInterval(() => {
        if (!isListening.value && transcript.value) {
          clearInterval(checkEnd)
          const parsed = parseTranscript(transcript.value)
          resolve({
            raw: transcript.value,
            parsed,
            params: toQueryParams(parsed),
          })
        }
        if (!isListening.value && error.value) {
          clearInterval(checkEnd)
          reject(new Error(error.value))
        }
      }, 200)

      startListening()

      // 30초 타임아웃
      setTimeout(() => {
        clearInterval(checkEnd)
        stopListening()
        if (transcript.value) {
          const parsed = parseTranscript(transcript.value)
          resolve({
            raw: transcript.value,
            parsed,
            params: toQueryParams(parsed),
          })
        } else {
          reject(new Error('음성 인식 시간이 초과되었습니다.'))
        }
      }, 30000)
    })
  }

  return {
    // 기본 음성 인식 상태
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,

    // 검색 파싱 기능
    parsedParams,
    parseTranscript,
    toQueryParams,
    listenAndParse,
  }
}

/** 지역 별칭 맵 생성 (긴 이름 우선 매칭) */
function buildRegionAliases() {
  const aliases = new Map()

  // 기본 지역명
  for (const r of REGIONS) {
    aliases.set(r.name, r.code)
  }

  // 축약어/별칭 추가
  const extra = {
    '서울특별시': 1, '서울시': 1,
    '인천광역시': 2, '인천시': 2,
    '대전광역시': 3, '대전시': 3,
    '대구광역시': 4, '대구시': 4,
    '광주광역시': 5, '광주시': 5,
    '부산광역시': 6, '부산시': 6,
    '울산광역시': 7, '울산시': 7,
    '세종특별자치시': 8, '세종시': 8,
    '경기': 31,
    '강원': 32, '강원특별자치도': 32,
    '충북': 33, '충청북': 33,
    '충남': 34, '충청남': 34,
    '경북': 35, '경상북': 35,
    '경남': 36, '경상남': 36,
    '전북특별자치도': 37, '전라북도': 37, '전라북': 37,
    '전라남도': 38, '전라남': 38,
    '제주': 39, '제주특별자치도': 39, '제주시': 39,
  }

  for (const [name, code] of Object.entries(extra)) {
    aliases.set(name, code)
  }

  // 긴 이름 우선 매칭을 위해 정렬
  return new Map([...aliases.entries()].sort((a, b) => b[0].length - a[0].length))
}

import { MOCK_ATTRACTIONS } from './mockData'

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

export const mockRecommendationApi = {
  async getRecommendations({ region, mobilityAid, themes }) {
    await delay()
    let results = [...MOCK_ATTRACTIONS]

    // 이동보조기기 필터링
    if (mobilityAid && mobilityAid !== 'NONE') {
      results = results.filter((a) => {
        if (['MANUAL_WHEELCHAIR', 'ELECTRIC_WHEELCHAIR'].includes(mobilityAid)) {
          return a.accessibility.wheelchairAccessible
        }
        if (mobilityAid === 'STROLLER') {
          return a.accessibility.strollerAccessible
        }
        if (mobilityAid === 'WALKING_AID') {
          return a.accessibility.elevatorAvailable || a.accessibility.rampAvailable
        }
        return true
      })
    }

    return {
      data: {
        parsedCondition: { region, mobilityAid, themes },
        attractions: results,
      },
    }
  },

  async getVoiceRecommendations(voiceText) {
    await delay(800)

    // 간단한 지역 추출 시뮬레이션
    const regionMatch = voiceText.match(/(서울|부산|제주|경주|대구|인천|광주|전주|강릉)/)?.[1] || '서울'

    return {
      data: {
        parsedCondition: {
          region: regionMatch,
          travelDays: voiceText.match(/(\d)박/)?.[1] ? Number(voiceText.match(/(\d)박/)[1]) + 1 : 1,
          mobilityAid: voiceText.includes('휠체어') ? 'MANUAL_WHEELCHAIR' : 'NONE',
        },
        attractions: MOCK_ATTRACTIONS.filter((a) => a.accessibility.wheelchairAccessible),
      },
    }
  },
}

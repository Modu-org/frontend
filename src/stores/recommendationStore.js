import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recommendationApi } from '@/api/recommendationApi'

export const useRecommendationStore = defineStore('recommendation', () => {
  const attractions = ref([])
  const parsedCondition = ref(null)
  const selectedAttractions = ref([])
  const isLoading = ref(false)

  async function fetchRecommendations(conditions) {
    isLoading.value = true
    try {
      const { data } = await recommendationApi.getRecommendations(conditions)
      attractions.value = data.attractions
      parsedCondition.value = data.parsedCondition
    } finally {
      isLoading.value = false
    }
  }

  async function fetchVoiceRecommendations(voiceText) {
    isLoading.value = true
    try {
      const { data } = await recommendationApi.getVoiceRecommendations(voiceText)
      attractions.value = data.attractions
      parsedCondition.value = data.parsedCondition
    } finally {
      isLoading.value = false
    }
  }

  function selectAttraction(attraction) {
    if (!selectedAttractions.value.find((a) => a.attractionId === attraction.attractionId)) {
      selectedAttractions.value.push(attraction)
    }
  }

  function unselectAttraction(attractionId) {
    selectedAttractions.value = selectedAttractions.value.filter(
      (a) => a.attractionId !== attractionId
    )
  }

  function clearAll() {
    attractions.value = []
    parsedCondition.value = null
    selectedAttractions.value = []
  }

  return {
    attractions,
    parsedCondition,
    selectedAttractions,
    isLoading,
    fetchRecommendations,
    fetchVoiceRecommendations,
    selectAttraction,
    unselectAttraction,
    clearAll,
  }
})

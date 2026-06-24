import { defineStore } from 'pinia'
import { ref } from 'vue'
import { caregiverApi } from '@/api/caregiverApi'
import { useToast } from '@/composables/useToast'

export const useCaregiverStore = defineStore('caregiver', () => {
  const { showToast } = useToast()

  const caregivers = ref([])
  const receivedRequests = ref([])
  const isLoading = ref(false)

  /** GET /caregivers */
  async function fetchCaregivers() {
    isLoading.value = true
    try {
      const { data: res } = await caregiverApi.getList()
      caregivers.value = res.data || []
    } catch {
      caregivers.value = []
    } finally {
      isLoading.value = false
    }
  }

  /** POST /caregivers */
  async function registerCaregiver(userName) {
    try {
      const { data: res } = await caregiverApi.register(userName)
      showToast(res.message || '보호자 등록 요청을 보냈습니다.', 'success')
      await fetchCaregivers()
      return res
    } catch (err) {
      const msg = err?.response?.data?.message || '보호자 등록에 실패했습니다.'
      showToast(msg, 'error')
      throw err
    }
  }

  /** DELETE /caregivers/{caregiverId} */
  async function removeCaregiver(caregiverId) {
    try {
      await caregiverApi.remove(caregiverId)
      caregivers.value = caregivers.value.filter(c => c.caregiverId !== caregiverId)
      showToast('보호자 등록이 해제되었습니다.', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || '보호자 해제에 실패했습니다.', 'error')
    }
  }

  /** GET /caregivers/requests/received */
  async function fetchReceivedRequests() {
    try {
      const { data: res } = await caregiverApi.getReceivedRequests()
      receivedRequests.value = res.data || []
    } catch {
      receivedRequests.value = []
    }
  }

  /** PATCH /caregivers/requests/{relationId}/accept */
  async function acceptRequest(relationId) {
    try {
      await caregiverApi.acceptRequest(relationId)
      receivedRequests.value = receivedRequests.value.filter(r => r.relationId !== relationId)
      showToast('보호자 요청을 수락했습니다.', 'success')
      await fetchCaregivers()
    } catch (err) {
      showToast(err?.response?.data?.message || '요청 수락에 실패했습니다.', 'error')
    }
  }

  /** DELETE /requests/{relationId}/reject */
  async function rejectRequest(relationId) {
    try {
      await caregiverApi.rejectRequest(relationId)
      receivedRequests.value = receivedRequests.value.filter(r => r.relationId !== relationId)
      showToast('보호자 요청을 거절했습니다.', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || '요청 거절에 실패했습니다.', 'error')
    }
  }

  return {
    caregivers,
    receivedRequests,
    isLoading,
    fetchCaregivers,
    registerCaregiver,
    removeCaregiver,
    fetchReceivedRequests,
    acceptRequest,
    rejectRequest,
  }
})

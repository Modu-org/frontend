import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scheduleApi } from '@/api/scheduleApi'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const currentSchedule = ref(null)
  const isLoading = ref(false)

  const totalSchedules = computed(() => schedules.value.length)

  /** GET /schedules */
  async function fetchSchedules() {
    isLoading.value = true
    try {
      const { data: res } = await scheduleApi.getAll()
      schedules.value = res.data.content
    } finally {
      isLoading.value = false
    }
  }

  /** GET /schedules/:id */
  async function fetchScheduleDetail(scheduleId) {
    isLoading.value = true
    try {
      const { data: res } = await scheduleApi.getById(scheduleId)
      currentSchedule.value = res.data
      return res.data
    } finally {
      isLoading.value = false
    }
  }

  /** POST /schedules */
  async function createSchedule(data) {
    isLoading.value = true
    try {
      const { data: res } = await scheduleApi.create(data)
      schedules.value.unshift(res.data)
      return res.data
    } finally {
      isLoading.value = false
    }
  }

  /** POST /schedules/:id (update) */
  async function updateSchedule(scheduleId, data) {
    isLoading.value = true
    try {
      const { data: res } = await scheduleApi.update(scheduleId, data)
      const idx = schedules.value.findIndex((s) => s.scheduleId === scheduleId)
      if (idx !== -1) schedules.value[idx] = res.data
      return res.data
    } finally {
      isLoading.value = false
    }
  }

  /** DELETE /schedules/:id */
  async function deleteSchedule(scheduleId) {
    isLoading.value = true
    try {
      await scheduleApi.delete(scheduleId)
      schedules.value = schedules.value.filter((s) => s.scheduleId !== scheduleId)
    } finally {
      isLoading.value = false
    }
  }

  /** POST /schedules/:id/nodes */
  async function addNode(scheduleId, data) {
    const { data: res } = await scheduleApi.addNode(scheduleId, data)
    return res.data
  }

  /** PATCH /schedules/:id/nodes/:nodeId */
  async function updateNode(scheduleId, nodeId, data) {
    const { data: res } = await scheduleApi.updateNode(scheduleId, nodeId, data)
    return res.data
  }

  /** DELETE /schedules/:id/nodes/:nodeId */
  async function deleteNode(scheduleId, nodeId) {
    await scheduleApi.deleteNode(scheduleId, nodeId)
  }

  function clearCurrent() {
    currentSchedule.value = null
  }

  return {
    schedules, currentSchedule, isLoading, totalSchedules,
    fetchSchedules, fetchScheduleDetail,
    createSchedule, updateSchedule, deleteSchedule,
    addNode, updateNode, deleteNode,
    clearCurrent,
  }
})

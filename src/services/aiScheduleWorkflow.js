import { reactive } from 'vue'

/** The browser sends only a proposal ID when approving; it never reconstructs tool arguments. */
export function createAiScheduleWorkflow(api) {
  const state = reactive({ status: 'idle', proposal: null, message: '', error: '', schedule: null })
  const busy = () => ['planning', 'confirming', 'cancelling'].includes(state.status)
  const errorMessage = (error) => error.response?.data?.message || error.message || '요청을 처리하지 못했습니다.'

  async function plan(text, attractionId = null) {
    if (busy() || state.proposal || !text.trim()) return
    state.status = 'planning'
    state.error = ''
    state.schedule = null
    try {
      const { data: response } = await api.aiWorkflow({ text: text.trim(), attractionId, apply: false })
      const result = response.data
      state.message = result.assistantMessage
      state.proposal = result.proposal || null
      state.status = state.proposal ? 'review' : 'idle'
    } catch (error) {
      state.status = 'idle'
      state.error = errorMessage(error)
    }
  }

  async function confirm() {
    if (busy() || !state.proposal) return null
    if (Date.parse(state.proposal.expiresAt) <= Date.now()) {
      state.proposal = null
      state.status = 'idle'
      state.error = '변경안이 만료되었습니다. 다시 요청해주세요.'
      return null
    }
    state.status = 'confirming'
    state.error = ''
    try {
      const { data: response } = await api.confirmAiProposal(state.proposal.proposalId)
      const result = response.data
      state.proposal = null
      state.schedule = result.schedule
      state.message = result.assistantMessage
      state.status = 'confirmed'
      return result
    } catch (error) {
      // A timeout may have occurred after commit. Keep the same ID for an idempotent retry.
      if ([404, 409, 410].includes(error.response?.status)) state.proposal = null
      state.status = state.proposal ? 'review' : 'idle'
      state.error = errorMessage(error)
      return null
    }
  }

  async function cancel() {
    if (busy() || !state.proposal) return false
    state.status = 'cancelling'
    state.error = ''
    try {
      await api.cancelAiProposal(state.proposal.proposalId)
      state.proposal = null
      state.status = 'idle'
      state.message = '변경안을 취소했습니다. 일정에는 반영되지 않았습니다.'
      return true
    } catch (error) {
      if ([404, 410].includes(error.response?.status)) state.proposal = null
      state.status = state.proposal ? 'review' : 'idle'
      state.error = errorMessage(error)
      return false
    }
  }

  return { state, plan, confirm, cancel }
}

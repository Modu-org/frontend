import test from 'node:test'
import assert from 'node:assert/strict'
import { createAiScheduleWorkflow } from '../src/services/aiScheduleWorkflow.js'

const proposal = () => ({ proposalId: 'server-proposal-id', expiresAt: new Date(Date.now() + 600000).toISOString(), changes: [] })
function fixture(overrides = {}) {
  const calls = []
  const api = {
    aiWorkflow: async data => { calls.push(['plan', data]); return { data: { data: { proposal: proposal(), assistantMessage: '확인해주세요' } } } },
    confirmAiProposal: async id => { calls.push(['confirm', id]); return { data: { data: { schedule: { scheduleId: 10 }, assistantMessage: '저장했습니다' } } } },
    cancelAiProposal: async id => { calls.push(['cancel', id]) },
    ...overrides,
  }
  return { workflow: createAiScheduleWorkflow(api), calls }
}

test('planning never confirms and explicitly requests a preview', async () => {
  const { workflow, calls } = fixture()
  await workflow.plan('  서울 일정에 추가해줘  ', 42)
  assert.deepEqual(calls, [['plan', { text: '서울 일정에 추가해줘', attractionId: 42, apply: false }]])
  assert.equal(workflow.state.status, 'review')
  assert.equal(workflow.state.schedule, null)
})

test('confirmation sends only the server proposal ID and duplicate clicks do not save twice', async () => {
  const { workflow, calls } = fixture()
  await workflow.plan('새 일정 만들어줘')
  await Promise.all([workflow.confirm(), workflow.confirm()])
  assert.deepEqual(calls.filter(c => c[0] === 'confirm'), [['confirm', 'server-proposal-id']])
  assert.equal(workflow.state.status, 'confirmed')
  assert.equal(workflow.state.proposal, null)
})

test('cancellation calls the cancellation API and never the confirmation API', async () => {
  const { workflow, calls } = fixture()
  await workflow.plan('추가해줘')
  await workflow.cancel()
  await workflow.confirm()
  assert.deepEqual(calls.map(c => c[0]), ['plan', 'cancel'])
  assert.equal(workflow.state.proposal, null)
})

test('a lost confirmation response keeps the same proposal for safe retry', async () => {
  let attempts = 0
  const ids = []
  const { workflow } = fixture({ confirmAiProposal: async id => {
    ids.push(id)
    if (++attempts === 1) throw new Error('응답 시간 초과')
    return { data: { data: { schedule: { scheduleId: 10 } } } }
  } })
  await workflow.plan('추가해줘')
  await workflow.confirm()
  assert.equal(workflow.state.status, 'review')
  assert.equal(workflow.state.proposal.proposalId, 'server-proposal-id')
  await workflow.confirm()
  assert.deepEqual(ids, ['server-proposal-id', 'server-proposal-id'])
})

test('expired proposals never trigger confirmation and stale responses clear the draft', async () => {
  const { workflow, calls } = fixture()
  await workflow.plan('추가해줘')
  workflow.state.proposal.expiresAt = new Date(Date.now() - 1000).toISOString()
  await workflow.confirm()
  assert.equal(workflow.state.proposal, null)
  assert.equal(calls.length, 1)
  const stale = fixture({ confirmAiProposal: async () => { throw { response: { status: 409, data: { message: '대상 일정 변경' } } } } })
  await stale.workflow.plan('추가해줘')
  await stale.workflow.confirm()
  assert.equal(stale.workflow.state.proposal, null)
  assert.equal(stale.workflow.state.error, '대상 일정 변경')
})

test('failed cancellation keeps the draft visible and prevents generating a replacement', async () => {
  const { workflow, calls } = fixture({ cancelAiProposal: async () => { throw new Error('네트워크 오류') } })
  await workflow.plan('추가해줘')
  await workflow.cancel()
  await workflow.plan('다른 일정에 추가해줘')
  assert.equal(workflow.state.status, 'review')
  assert.equal(calls.length, 1)
})

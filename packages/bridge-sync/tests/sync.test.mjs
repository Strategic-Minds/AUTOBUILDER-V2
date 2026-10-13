import test from 'node:test'
import assert from 'node:assert/strict'
import {canonical,sha256,compileSyncPreview,DryRunLedger,foresightGate,validateReadback} from '../sync.mjs'

const input = (over={}) => ({
  projectId:'digital-dominance',tenantId:'tenant-a',actor:{id:'planner',tenantId:'tenant-a'},
  sourceSystem:'chatgpt',sourceVersion:'synthetic-sha',recordId:'SystemRegistry:synthetic',
  lastAcknowledged:{phase:'discovery',name:'site'},sourceCurrent:{phase:'strategy',name:'site'},
  targetCurrent:{phase:'discovery',name:'site'},actionClass:'DRAFT',...over
})
test('stable canonical content hashes',()=>{
  assert.equal(sha256({b:1,a:2}),sha256({a:2,b:1}))
  assert.equal(canonical([1,2]),'[1,2]')
})
test('preview creates only a proposed update',()=>{
  const p=compileSyncPreview(input())
  assert.equal(p.status,'PENDING_REVIEW')
  assert.equal(p.writes_executed,0)
  assert.equal(p.side_effects,false)
  assert.equal(p.deltas.find(d=>d.field==='phase').action,'PROPOSE_UPDATE')
})
test('packet identity is deterministic',()=>{
  assert.equal(compileSyncPreview(input()).packet_id,compileSyncPreview(input()).packet_id)
})
test('five repeated packets produce one synthetic acknowledgement',()=>{
  const plan=compileSyncPreview(input()), ledger=new DryRunLedger()
  const results=Array.from({length:5},()=>ledger.acknowledge(plan).state)
  assert.deepEqual(results,['PREVIEW_ACKNOWLEDGED',...Array(4).fill('DUPLICATE_DRY_RUN')])
})
test('conflicting edits fail closed',()=>{
  const p=compileSyncPreview(input({sourceCurrent:{phase:'strategy'},targetCurrent:{phase:'deployed'},lastAcknowledged:{phase:'discovery'}}))
  assert.equal(p.status,'CONFLICT')
  assert.equal(p.deltas[0].action,'CONFLICT')
  assert.equal(p.writes_executed,0)
})
test('unacknowledged baseline fails closed',()=>{
  const p=compileSyncPreview(input({lastAcknowledged:null}))
  assert.equal(p.status,'CONFLICT')
})
test('first sync can propose missing fields only',()=>{
  const p=compileSyncPreview(input({firstSync:true,lastAcknowledged:null,targetCurrent:{},sourceCurrent:{name:'test'}}))
  assert.equal(p.deltas[0].action,'ADD')
  assert.equal(p.status,'PENDING_REVIEW')
})
test('changed target remains authoritative when source is unchanged',()=>{
  const p=compileSyncPreview(input({lastAcknowledged:{phase:'discovery'},sourceCurrent:{phase:'discovery'},targetCurrent:{phase:'live'}}))
  assert.equal(p.deltas[0].action,'RETAIN_TARGET_CHANGED')
  assert.equal(p.proposal_count,0)
})
test('tenant mismatch fails closed',()=>{
  assert.throws(()=>compileSyncPreview(input({actor:{id:'planner',tenantId:'tenant-b'}})),/TENANT_OR_ACTOR_MISMATCH/)
})
test('all protected actions held',()=>{
  const p=compileSyncPreview(input({actionClass:'PROTECTED'}))
  assert.equal(p.status,'HOLD')
  assert.ok(p.holds.includes('PROTECTED_ACTION_APPROVAL_REQUIRED'))
})
test('branch and preview writes need an externally bound scope',()=>{
  const p=compileSyncPreview(input({actionClass:'BRANCH_WRITE'}))
  assert.equal(p.status,'HOLD')
  assert.ok(p.holds.includes('WRITE_SCOPE_NOT_BOUND_IN_PREVIEW_COMPILER'))
})
test('secrets are not accepted in payloads',()=>{
  assert.throws(()=>compileSyncPreview(input({sourceCurrent:{token:'secret'}})),/SENSITIVE_FIELD_REJECTED/)
})
test('contact data is not accepted in payloads',()=>{
  assert.throws(()=>compileSyncPreview(input({sourceCurrent:{contact_email:'private'}})),/SENSITIVE_FIELD_REJECTED/)
})
test('new creative mission without foresight receipt held',()=>{
  const p=compileSyncPreview(input({newCreativeMission:true}))
  assert.equal(p.status,'HOLD')
  assert.equal(p.gate.state,'HOLD_FORESIGHT_RECEIPT_MISSING')
})
const receipt=(validator='guardian')=>({
  receipt_id:'fixture-1',buyer_value:'buyer-backed pilot hypothesis',
  recommended_strategy:'original service tool',assumptions:'synthetic assumptions',
  sensitivity_tests:'fixed-seed experiment',independent_validator_ref:validator,
  approval_state:'APPROVED',validation_status:'PASS',
  alternatives:['service','tool'],evidence_refs:['fixture-source']
})
test('structurally valid independent foresight receipt clears a planning hold',()=>{
  const p=compileSyncPreview(input({newCreativeMission:true,foresightReceipt:receipt()}))
  assert.equal(p.gate.state,'FORESIGHT_GATE_PASSED')
  assert.equal(p.status,'PENDING_REVIEW')
})
test('a builder cannot validate its own foresight',()=>{
  const p=compileSyncPreview(input({newCreativeMission:true,foresightReceipt:receipt('planner')}))
  assert.equal(p.status,'HOLD')
})
test('an approved existing design continues its phase',()=>{
  const p=compileSyncPreview(input({approvedDesignRef:'approved-design-v2'}))
  assert.equal(p.gate.state,'EXISTING_APPROVED_RESUME')
})
test('validator must be independent with receipt',()=>{
  assert.equal(validateReadback({expectedHash:sha256({x:1}),observedSnapshot:{x:1},builderId:'same',validatorId:'same',evidenceRef:'proof'}).status,'BLOCKED')
})
test('readback checks actual expected hash',()=>{
  assert.equal(validateReadback({expectedHash:sha256({x:1}),observedSnapshot:{x:1},builderId:'builder',validatorId:'guardian',evidenceRef:'proof'}).status,'PASS')
  assert.equal(validateReadback({expectedHash:sha256({x:1}),observedSnapshot:{x:2},builderId:'builder',validatorId:'guardian',evidenceRef:'proof'}).status,'FAIL')
})
test('arrays cannot replace record objects',()=>{
  assert.throws(()=>compileSyncPreview(input({sourceCurrent:[]})),/plain object/)
})

import { createHash } from 'node:crypto'

// Isolated preview compiler. NO networking, provider writes, cron or queue.
export const CONTRACT_VERSION = 'smai-sync-v1'
const allowed = new Set(['READ','DRAFT','BRANCH_WRITE','PREVIEW_WRITE','PROTECTED'])
const sensitive = /(?:password|token|secret|api_key|private_key|service_role|authorization|cookie|email|phone|ssn|card_number|credential|vault)/i

function object(value, name) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype)
    throw new TypeError(name + ' must be a plain object')
}
export function canonical(value) {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)))
    return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
  throw new TypeError('Unsupported or unsafe JSON value')
}
export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex')
}
function scan(value, prefix = '') {
  if (Array.isArray(value)) value.forEach((v,i) => scan(v,prefix + '[' + i + '].'))
  else if (value && typeof value === 'object') for (const [k,v] of Object.entries(value)) {
    if (sensitive.test(k)) throw new Error('SENSITIVE_FIELD_REJECTED: ' + prefix + k)
    scan(v,prefix + k + '.')
  }
}
function equals(a,b) {
  if (a === undefined || b === undefined) return a === b
  return canonical(a) === canonical(b)
}
function digest(record, field) {
  return Object.prototype.hasOwnProperty.call(record,field) ? sha256(record[field]) : null
}
export function foresightGate({newCreativeMission=false,receipt=null,approvedDesignRef=null,builderId='builder'}={}) {
  if (!newCreativeMission) return {pass:true,state:approvedDesignRef ? 'EXISTING_APPROVED_RESUME' : 'NOT_A_NEW_CREATIVE_MISSION'}
  if (!receipt) return {pass:false,state:'HOLD_FORESIGHT_RECEIPT_MISSING'}
  const keys=['receipt_id','buyer_value','recommended_strategy','assumptions','sensitivity_tests','independent_validator_ref','approval_state']
  if (keys.some(k=>!receipt[k]) || !Array.isArray(receipt.evidence_refs) || !receipt.evidence_refs.length || !Array.isArray(receipt.alternatives) || receipt.alternatives.length < 2)
    return {pass:false,state:'HOLD_FORESIGHT_INCOMPLETE'}
  if (receipt.independent_validator_ref === builderId || receipt.validation_status !== 'PASS')
    return {pass:false,state:'HOLD_VALIDATOR_NOT_INDEPENDENT'}
  if (receipt.approval_state !== 'APPROVED') return {pass:false,state:'HOLD_CREATIVE_APPROVAL'}
  return {pass:true,state:'FORESIGHT_GATE_PASSED',receipt_id:String(receipt.receipt_id)}
}
export function compileSyncPreview(input) {
  object(input,'input')
  const {projectId,tenantId,actor,sourceSystem,sourceVersion,recordId,sourceCurrent,targetCurrent,
    lastAcknowledged=null,firstSync=false,actionClass='DRAFT',
    newCreativeMission=false,foresightReceipt=null,approvedDesignRef=null} = input
  for (const [key,val] of Object.entries({projectId,tenantId,sourceSystem,sourceVersion,recordId}))
    if(typeof val !== 'string' || !val.trim()) throw new Error('MISSING_' + key.toUpperCase())
  object(actor,'actor')
  if (!actor.id || actor.tenantId !== tenantId) throw new Error('TENANT_OR_ACTOR_MISMATCH')
  if (!allowed.has(actionClass)) throw new Error('INVALID_ACTION_CLASS')
  object(sourceCurrent,'sourceCurrent'); object(targetCurrent,'targetCurrent')
  if (lastAcknowledged !== null) object(lastAcknowledged,'lastAcknowledged')
  scan(sourceCurrent);scan(targetCurrent)
  if(lastAcknowledged !== null) scan(lastAcknowledged)
  if(foresightReceipt !== null) scan(foresightReceipt)
  const gate=foresightGate({newCreativeMission,receipt:foresightReceipt,approvedDesignRef,builderId:actor.id})
  const fields=[...new Set([...Object.keys(sourceCurrent),...Object.keys(targetCurrent),...Object.keys(lastAcknowledged||{})])].sort()
  let conflicted=false
  const deltas=fields.map(field=>{
    const src=Object.prototype.hasOwnProperty.call(sourceCurrent,field)?sourceCurrent[field]:undefined
    const dst=Object.prototype.hasOwnProperty.call(targetCurrent,field)?targetCurrent[field]:undefined
    const base=lastAcknowledged && Object.prototype.hasOwnProperty.call(lastAcknowledged,field)?lastAcknowledged[field]:undefined
    let action='RETAIN'
    if(equals(src,dst)) action='RETAIN'
    else if(lastAcknowledged===null && !firstSync) action='CONFLICT_NO_BASELINE'
    else if(lastAcknowledged===null && firstSync) action=dst===undefined?'ADD':'CONFLICT'
    else if(equals(src,base)) action='RETAIN_TARGET_CHANGED'
    else if(equals(dst,base)) action=src===undefined?'PROPOSE_REMOVE':'PROPOSE_UPDATE'
    else action='CONFLICT'
    if(action.startsWith('CONFLICT')) conflicted=true
    return {field,action,source_hash:digest(sourceCurrent,field),target_hash:digest(targetCurrent,field),baseline_hash:lastAcknowledged ? digest(lastAcknowledged,field):null}
  })
  const sourceHash=sha256(sourceCurrent),targetHash=sha256(targetCurrent),baselineHash=lastAcknowledged===null?null:sha256(lastAcknowledged)
  const packetId=sha256({contract:CONTRACT_VERSION,projectId,tenantId,recordId,sourceSystem,sourceVersion,sourceHash,targetHash,baselineHash,actionClass})
  const holds=[...(actionClass==='PROTECTED'?['PROTECTED_ACTION_APPROVAL_REQUIRED']:[]),
    ...(['BRANCH_WRITE','PREVIEW_WRITE'].includes(actionClass)?['WRITE_SCOPE_NOT_BOUND_IN_PREVIEW_COMPILER']:[]),
    ...(!gate.pass?[gate.state]:[])]
  return Object.freeze({
    schema_version:CONTRACT_VERSION,packet_id:packetId,idempotency_key:'sync:'+packetId,project_id:projectId,tenant_id:tenantId,
    actor_id:String(actor.id),source_system:sourceSystem,source_version:sourceVersion,record_id:recordId,action_class:actionClass,
    source_hash:sourceHash,expected_target_hash:targetHash,last_acknowledged_hash:baselineHash,
    status:conflicted?'CONFLICT':holds.length?'HOLD':'PENDING_REVIEW',gate,holds,deltas,
    proposal_count:deltas.filter(d=>['ADD','PROPOSE_UPDATE','PROPOSE_REMOVE'].includes(d.action)).length,
    writes_executed:0,side_effects:false,runtime_dispatch:'NOT_CONFIGURED',independent_validation:'NOT_EXECUTED',
    rollback:'No provider mutation: discard preview'
  })
}
export class DryRunLedger {
  constructor() {this.seen=new Set()}
  acknowledge(plan) {
    if (!plan || plan.schema_version!==CONTRACT_VERSION) throw new Error('INVALID_PLAN')
    if (this.seen.has(plan.idempotency_key)) return {state:'DUPLICATE_DRY_RUN',writes_executed:0}
    this.seen.add(plan.idempotency_key)
    return {state:'PREVIEW_ACKNOWLEDGED',writes_executed:0}
  }
}
export function validateReadback({expectedHash,observedSnapshot,builderId,validatorId,evidenceRef}) {
  if(!builderId || !validatorId || builderId===validatorId || !evidenceRef)
    return {status:'BLOCKED',reason:'INDEPENDENT_EVIDENCE_REQUIRED'}
  object(observedSnapshot,'observedSnapshot');scan(observedSnapshot)
  return sha256(observedSnapshot)===expectedHash
    ?{status:'PASS',validator_id:validatorId,evidence_ref:evidenceRef}
    :{status:'FAIL',reason:'HASH_MISMATCH'}
}

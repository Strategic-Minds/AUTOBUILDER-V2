import type { OpportunityEconomics } from './core'

type JsonRecord = Record<string, unknown>

export type BacklogOpportunityRow = OpportunityEconomics & {
  id: string
  customer_key: string
  source_type: string
  source_id: string
  title: string
  status: string
  estimated_contract_value: number
  estimated_gross_margin: number
  probability_of_award: number
  strategic_fit: number
  confidence: number
  reusability: number
  estimated_pursuit_cost: number
  risk_factor: number
}

export type LeaseRow = {
  id: string
  lease_token: string
  system_id: string
  cycle_key: string
  holder: string
  state: 'running' | 'completed' | 'failed'
  expires_at: string
  completed_at: string | null
}

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('BACKLOG_DATABASE_NOT_CONFIGURED')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const raw = await response.text()
  if (!response.ok) {
    if (response.status === 404 || raw.includes('PGRST202') || raw.includes('Could not find the function')) {
      throw new Error(`BACKLOG_MIGRATION_REQUIRED: ${raw.slice(0, 300)}`)
    }
    throw new Error(`BACKLOG_DATABASE_${method}_FAILED_${response.status}: ${raw.slice(0, 500)}`)
  }
  if (!raw) return null as T
  return JSON.parse(raw) as T
}

async function rpc<T>(name: string, body: JsonRecord): Promise<T> {
  return db<T>(`rpc/${name}`, 'POST', body)
}

export async function latestCompletedBacklogCycle(systemId: string) {
  const rows = await db<Array<{ completed_at: string }>>(`backlog_execution_leases?system_id=eq.${encodeURIComponent(systemId)}&state=eq.completed&select=completed_at&order=completed_at.desc&limit=1`)
  return rows[0]?.completed_at ?? null
}

export async function claimBacklogLease(systemId: string, workerId: string, cycleKey: string, leaseSeconds = 3300): Promise<LeaseRow | null> {
  const rows = await rpc<LeaseRow[]>('backlog_claim_hourly_lease', {
    p_system_id: systemId,
    p_worker_id: workerId,
    p_cycle_key: cycleKey,
    p_lease_seconds: leaseSeconds,
  })
  return rows[0] ?? null
}

export async function finishBacklogLease(lease: LeaseRow, state: 'completed' | 'failed', result: JsonRecord) {
  const rows = await rpc<LeaseRow[]>('backlog_finish_hourly_lease', {
    p_lease_id: lease.id,
    p_lease_token: lease.lease_token,
    p_state: state,
    p_result: result,
  })
  return rows[0] ?? null
}

export async function listOpenBacklogOpportunities(limit = 200) {
  const rows = await db<Array<Record<string, unknown>>>(`backlog_opportunities?status=in.(discovered,qualified)&order=updated_at.desc&limit=${Math.max(1, Math.min(limit, 500))}`)
  return rows.map((row) => ({
    ...row,
    estimatedContractValue: Number(row.estimated_contract_value) || 0,
    estimatedGrossMargin: Number(row.estimated_gross_margin) || 0,
    probabilityOfAward: Number(row.probability_of_award) || 0,
    strategicFit: Number(row.strategic_fit) || 0,
    confidence: Number(row.confidence) || 0,
    reusability: Number(row.reusability) || 0,
    estimatedPursuitCost: Number(row.estimated_pursuit_cost) || 0,
    riskFactor: Number(row.risk_factor) || 1,
  })) as BacklogOpportunityRow[]
}

export async function recordBacklogImprovementRun(input: {
  systemId: string
  cycleKey: string
  workerId: string
  selectedOpportunityId?: string | null
  selectedCustomerKey?: string | null
  baseline: JsonRecord
  recommendation: JsonRecord
}) {
  const rows = await db<Array<{ id: string }>>('backlog_improvement_runs', 'POST', {
    system_id: input.systemId,
    cycle_key: input.cycleKey,
    worker_id: input.workerId,
    objective: 'MAXIMIZE VERIFIED PROFITABLE BACKLOG GENERATED PER CUSTOMER',
    state: 'completed',
    selected_opportunity_id: input.selectedOpportunityId || null,
    customer_key: input.selectedCustomerKey || null,
    baseline: input.baseline,
    recommendation: input.recommendation,
    production_locked: true,
    completed_at: new Date().toISOString(),
  })
  return rows[0] ?? null
}

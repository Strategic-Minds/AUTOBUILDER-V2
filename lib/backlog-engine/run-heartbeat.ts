import {
  ECONOMIC_OBJECTIVE,
  hourlyCycleKey,
  opportunityValueScore,
  shouldRunHourlyCycle,
} from './core'
import {
  claimBacklogLease,
  finishBacklogLease,
  latestCompletedBacklogCycle,
  listOpenBacklogOpportunities,
  recordBacklogImprovementRun,
} from './store'

const SYSTEM_ID = 'autonomous-backlog-engine-v1'

function blockedState(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('BACKLOG_MIGRATION_REQUIRED')) return 'BLOCKED_BACKLOG_MIGRATION_REQUIRED'
  if (message.includes('BACKLOG_DATABASE_NOT_CONFIGURED')) return 'BLOCKED_BACKLOG_DATABASE_CONFIGURATION'
  return 'DEGRADED'
}

export async function runBacklogHeartbeat(now = new Date()) {
  const workerId = `backlog-${crypto.randomUUID()}`
  let lease: Awaited<ReturnType<typeof claimBacklogLease>> = null
  try {
    const lastCompletedAt = await latestCompletedBacklogCycle(SYSTEM_ID)
    if (!shouldRunHourlyCycle(lastCompletedAt, now)) {
      return {
        ok: true,
        state: 'HEARTBEAT_ONLY',
        objective: ECONOMIC_OBJECTIVE,
        last_completed_at: lastCompletedAt,
        production_mutation: false,
      }
    }

    const cycleKey = hourlyCycleKey(now)
    lease = await claimBacklogLease(SYSTEM_ID, workerId, cycleKey, 3300)
    if (!lease) {
      return {
        ok: true,
        state: 'LEASE_HELD_OR_CYCLE_COMPLETE',
        cycle_key: cycleKey,
        objective: ECONOMIC_OBJECTIVE,
        production_mutation: false,
      }
    }

    const opportunities = await listOpenBacklogOpportunities()
    const ranked = opportunities
      .map((opportunity) => ({ opportunity, economics: opportunityValueScore(opportunity) }))
      .sort((left, right) => right.economics.score - left.economics.score)

    const selected = ranked[0] ?? null
    const baseline = {
      open_opportunities: opportunities.length,
      ranked_opportunities: ranked.length,
      top_score: selected?.economics.score ?? null,
      top_expected_gross_profit: selected?.economics.expectedGrossProfit ?? null,
    }
    const recommendation = selected
      ? {
          action: 'draft_bid_readiness_work_packet',
          opportunity_id: selected.opportunity.id,
          customer_key: selected.opportunity.customer_key,
          value_score: selected.economics.score,
          expected_gross_profit: selected.economics.expectedGrossProfit,
          protected_next_actions: ['customer_communication', 'bid_submission'],
          browser_validation_provider: 'BrowserWorker_or_CloudBrowser',
        }
      : {
          action: 'draft_opportunity_discovery_plan',
          reason: 'no_open_opportunities',
          protected_next_actions: ['customer_communication', 'bid_submission'],
          browser_validation_provider: 'BrowserWorker_or_CloudBrowser',
        }

    const run = await recordBacklogImprovementRun({
      systemId: SYSTEM_ID,
      cycleKey,
      workerId,
      selectedOpportunityId: selected?.opportunity.id ?? null,
      selectedCustomerKey: selected?.opportunity.customer_key ?? null,
      baseline,
      recommendation,
    })
    const result = {
      objective: ECONOMIC_OBJECTIVE,
      baseline,
      recommendation,
      improvement_run_id: run?.id ?? null,
      production_mutation: false,
    }
    await finishBacklogLease(lease, 'completed', result)
    return { ok: true, state: 'HOURLY_CYCLE_COMPLETED', cycle_key: cycleKey, ...result }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (lease) {
      await finishBacklogLease(lease, 'failed', { error: message.slice(0, 800), production_mutation: false }).catch(() => null)
    }
    return {
      ok: false,
      state: blockedState(error),
      error: message.slice(0, 800),
      objective: ECONOMIC_OBJECTIVE,
      production_mutation: false,
    }
  }
}

export const ECONOMIC_OBJECTIVE = 'MAXIMIZE VERIFIED PROFITABLE BACKLOG GENERATED PER CUSTOMER' as const

export const PROTECTED_ACTIONS = [
  'merge_to_default_branch',
  'production_deploy',
  'production_database_migration',
  'secret_change',
  'domain_change',
  'billing_or_spend',
  'destructive_action',
  'customer_communication',
  'bid_submission',
  'contract_acceptance',
] as const

export type ProtectedAction = typeof PROTECTED_ACTIONS[number]
export type ActionClassification = 'invalid' | 'protected' | 'read' | 'draft' | 'branch_safe' | 'review'

const protectedSet = new Set<string>(PROTECTED_ACTIONS)
const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
const clamp100 = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

export function classifyAction(action: string): ActionClassification {
  if (!action) return 'invalid'
  if (protectedSet.has(action)) return 'protected'
  if (/^(read|inspect|search|validate)_/.test(action)) return 'read'
  if (/^(draft|simulate|score|plan)_/.test(action)) return 'draft'
  if (/^(branch|sandbox|preview|test)_/.test(action)) return 'branch_safe'
  return 'review'
}

export function actionAllowed(action: string, approvedActions: string[] = []) {
  const classification = classifyAction(action)
  const allowed = classification !== 'protected' || approvedActions.includes(action)
  return { action, classification, allowed, reason: allowed ? null : 'EXPLICIT_APPROVAL_REQUIRED' }
}

export type OpportunityEconomics = {
  estimatedContractValue: number
  estimatedGrossMargin: number
  probabilityOfAward: number
  strategicFit: number
  confidence: number
  reusability?: number
  estimatedPursuitCost: number
  riskFactor: number
}

export function expectedGrossProfit(input: OpportunityEconomics) {
  return Math.max(0, input.estimatedContractValue || 0)
    * clamp01(input.estimatedGrossMargin || 0)
    * clamp01(input.probabilityOfAward || 0)
}

export function opportunityValueScore(input: OpportunityEconomics) {
  const expected = expectedGrossProfit(input)
  const numerator = expected
    * Math.max(0.01, clamp01(input.strategicFit))
    * Math.max(0.01, clamp01(input.confidence))
    * Math.max(0.01, clamp01(input.reusability ?? 1))
  const denominator = Math.max(1, input.estimatedPursuitCost || 1) * Math.max(0.1, input.riskFactor || 1)
  const rawValue = numerator / denominator
  const score = rawValue <= 0 ? 0 : Math.min(100, Math.log10(1 + rawValue) * 25)
  return { expectedGrossProfit: expected, rawValue, score: Number(score.toFixed(2)) }
}

export type AttributionEvent = {
  type:
    | 'opportunity.discovered'
    | 'opportunity.qualified'
    | 'bid.prepared'
    | 'bid.submitted'
    | 'award.won'
    | 'gross_profit.estimated'
    | 'gross_profit.realized'
    | 'cost.platform'
    | 'cost.ai'
    | 'cost.browser'
  amount?: number
}

export function summarizeEconomicAttribution(events: AttributionEvent[]) {
  const result = {
    opportunitiesDiscovered: 0,
    opportunityValue: 0,
    qualifiedOpportunityValue: 0,
    bidsPrepared: 0,
    bidValue: 0,
    bidsSubmitted: 0,
    awards: 0,
    awardValue: 0,
    estimatedGrossProfit: 0,
    realizedGrossProfit: 0,
    platformOperatingCost: 0,
    aiCost: 0,
    browserCost: 0,
  }
  for (const event of events) {
    const amount = Number(event.amount) || 0
    if (event.type === 'opportunity.discovered') { result.opportunitiesDiscovered += 1; result.opportunityValue += amount }
    else if (event.type === 'opportunity.qualified') result.qualifiedOpportunityValue += amount
    else if (event.type === 'bid.prepared') { result.bidsPrepared += 1; result.bidValue += amount }
    else if (event.type === 'bid.submitted') result.bidsSubmitted += 1
    else if (event.type === 'award.won') { result.awards += 1; result.awardValue += amount }
    else if (event.type === 'gross_profit.estimated') result.estimatedGrossProfit += amount
    else if (event.type === 'gross_profit.realized') result.realizedGrossProfit += amount
    else if (event.type === 'cost.platform') result.platformOperatingCost += amount
    else if (event.type === 'cost.ai') result.aiCost += amount
    else if (event.type === 'cost.browser') result.browserCost += amount
  }
  const cost = result.platformOperatingCost + result.aiCost + result.browserCost
  return {
    ...result,
    verifiedBacklogGenerated: result.awardValue,
    verifiedGrossProfitAttributed: result.realizedGrossProfit,
    customerRoi: cost > 0 ? result.realizedGrossProfit / cost : null,
    costPerBid: result.bidsPrepared > 0 ? cost / result.bidsPrepared : null,
    costPerAwardedDollar: result.awardValue > 0 ? cost / result.awardValue : null,
  }
}

export function attributionConfidence(evidenceTypes: string[]) {
  const required = ['customer_id', 'opportunity_id', 'bid_id', 'award_evidence']
  const present = new Set(evidenceTypes)
  return Math.round(required.filter((type) => present.has(type)).length / required.length * 100)
}

export type SystemMetrics = {
  backlogGeneration: number
  grossProfitImpact: number
  opportunityQualityAccuracy: number
  bidAccuracy: number
  winRatePrediction: number
  reliability: number
  autonomy: number
  humanIntervention: number
  security: number
  observability: number
  performance: number
  costEfficiency: number
  dataQuality: number
  customerValue: number
  regressionSafety: number
}

export const DEFAULT_SYSTEM_WEIGHTS: Record<keyof SystemMetrics, number> = {
  backlogGeneration: 0.18,
  grossProfitImpact: 0.16,
  opportunityQualityAccuracy: 0.08,
  bidAccuracy: 0.07,
  winRatePrediction: 0.05,
  reliability: 0.08,
  autonomy: 0.05,
  humanIntervention: 0.04,
  security: 0.08,
  observability: 0.04,
  performance: 0.04,
  costEfficiency: 0.05,
  dataQuality: 0.04,
  customerValue: 0.03,
  regressionSafety: 0.01,
}

export function systemScore(metrics: SystemMetrics, weights = DEFAULT_SYSTEM_WEIGHTS) {
  let weighted = 0
  let total = 0
  for (const [key, weight] of Object.entries(weights) as Array<[keyof SystemMetrics, number]>) {
    const metric = clamp100(metrics[key] ?? 0)
    weighted += (key === 'humanIntervention' ? 100 - metric : metric) * weight
    total += weight
  }
  return total > 0 ? Number((weighted / total).toFixed(2)) : 0
}

export type Variant = { score: number; blockingRegressions?: number }
export function compareChampion(champion: Variant, challenger: Variant, minDelta = 0.25) {
  const delta = challenger.score - champion.score
  if ((challenger.blockingRegressions ?? 0) > 0) return { decision: 'reject' as const, reason: 'blocking_regression', delta }
  if (delta >= minDelta) return { decision: 'candidate' as const, reason: 'measurably_better', delta }
  return { decision: 'reject' as const, reason: delta < 0 ? 'worse_than_champion' : 'insufficient_delta', delta }
}

export function hourlyCycleKey(now = new Date()) {
  const iso = now.toISOString()
  return `${iso.slice(0, 13)}:00Z`
}

export function shouldRunHourlyCycle(lastCompletedAt: string | null, now = new Date()) {
  if (!lastCompletedAt) return true
  const last = Date.parse(lastCompletedAt)
  return !Number.isFinite(last) || now.getTime() - last >= 60 * 60 * 1000
}

export const BROWSER_EVIDENCE_CONTRACT = {
  providers: ['BrowserWorker', 'CloudBrowser'],
  allowedActions: [
    'discover_opportunities',
    'navigate_authorized_portal',
    'extract_project_details',
    'download_authorized_documents',
    'monitor_addenda',
    'capture_screenshot_evidence',
    'validate_application_workflow',
  ],
  blockedActions: ['payment', 'send_message', 'bid_submit', 'bypass_access_control', 'bypass_captcha'],
  requiredEvidence: ['screenshot', 'extracted_state', 'timestamp', 'job_receipt'],
} as const

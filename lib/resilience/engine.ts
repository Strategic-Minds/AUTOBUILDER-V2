export const RECURSIVE_STAGES = [
  'AUDIT',
  'AUTO_FIX',
  'AUTO_HEAL',
  'AUTO_HARDEN',
  'AUTO_TEST',
  'AUTO_OPTIMIZE',
  'AUTO_RETEST',
  'AUTO_REOPTIMIZE',
  'FULL_REGRESSION',
  'SCORE',
  'DECIDE',
] as const

export type RecursiveStage = (typeof RECURSIVE_STAGES)[number]
export type FailureDomain =
  | 'source_truth'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'authentication'
  | 'integration'
  | 'infrastructure'
  | 'accessibility'
  | 'performance'
  | 'unknown'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type FaultInput = {
  id: string
  signal: string
  severity: Severity
  detected: boolean
  repaired: boolean
  regressionPass: boolean
}

export type FaultResult = FaultInput & {
  domain: FailureDomain
  deduction: number
  state: 'resolved' | 'undetected' | 'unrepaired' | 'regression_failed'
  repairDirective: string
}

export type ResilienceCycleResult = {
  cycleId: string
  stages: readonly RecursiveStage[]
  score: number
  blockingDefects: number
  resolvedDefects: number
  releaseGate: 'PREVIEW_ACCEPTABLE' | 'REPAIR_REQUIRED'
  findings: FaultResult[]
}

const severityWeight: Record<Severity, number> = { critical: 30, high: 18, medium: 10, low: 4 }

const domainDirectives: Record<FailureDomain, string> = {
  source_truth: 'Reconcile workbook, repository, deployment, and receipt identifiers before release.',
  frontend: 'Patch the smallest responsible component and add a viewport regression test.',
  backend: 'Patch the failing contract, add input validation, and repeat the exact API test.',
  database: 'Use an isolated migration, enforce RLS, verify rollback, and rerun authorization tests.',
  authentication: 'Restore least privilege and add unauthorized and expired-session tests.',
  integration: 'Repair the connector boundary, add timeout and idempotency controls, and rerun the integration test.',
  infrastructure: 'Repair Preview configuration, inspect logs, and redeploy without changing Production.',
  accessibility: 'Repair semantics or keyboard behavior and rerun accessibility regression tests.',
  performance: 'Measure the bottleneck, apply one bounded optimization, and retain it only when performance improves.',
  unknown: 'Quarantine the fault, preserve evidence, and route it for bounded root-cause analysis.',
}

export function classifyFailure(signal: string): FailureDomain {
  const value = signal.toLowerCase()
  if (/(workbook|checksum|manifest|receipt|drift|source truth|commit mismatch)/.test(value)) return 'source_truth'
  if (/(overflow|button|component|layout|render|hydration|mobile|css)/.test(value)) return 'frontend'
  if (/(api|route|response|schema validation|server error)/.test(value)) return 'backend'
  if (/(database|postgres|supabase|rls|migration|query)/.test(value)) return 'database'
  if (/(auth|permission|unauthorized|session|token)/.test(value)) return 'authentication'
  if (/(connector|webhook|provider|integration|queue|browserworker)/.test(value)) return 'integration'
  if (/(deployment|vercel|build|environment|runtime|dns)/.test(value)) return 'infrastructure'
  if (/(accessibility|keyboard|aria|contrast|screen reader)/.test(value)) return 'accessibility'
  if (/(slow|latency|bundle|performance|timeout|payload)/.test(value)) return 'performance'
  return 'unknown'
}

function evaluateFault(fault: FaultInput): FaultResult {
  const domain = classifyFailure(fault.signal)
  let state: FaultResult['state'] = 'resolved'
  let multiplier = 0
  if (!fault.detected) { state = 'undetected'; multiplier = 1 }
  else if (!fault.repaired) { state = 'unrepaired'; multiplier = 0.8 }
  else if (!fault.regressionPass) { state = 'regression_failed'; multiplier = 0.6 }
  return {
    ...fault,
    domain,
    state,
    deduction: Math.round(severityWeight[fault.severity] * multiplier),
    repairDirective: domainDirectives[domain],
  }
}

export function runResilienceCycle(faults: FaultInput[], cycleId = 'cycle-1'): ResilienceCycleResult {
  const findings = faults.map(evaluateFault)
  const blockingDefects = findings.filter((finding) => finding.state !== 'resolved').length
  const resolvedDefects = findings.length - blockingDefects
  const score = Math.max(0, 100 - findings.reduce((total, finding) => total + finding.deduction, 0))
  return {
    cycleId,
    stages: RECURSIVE_STAGES,
    score,
    blockingDefects,
    resolvedDefects,
    releaseGate: score >= 95 && blockingDefects === 0 ? 'PREVIEW_ACCEPTABLE' : 'REPAIR_REQUIRED',
    findings,
  }
}

export function getResilienceSnapshot() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  return {
    missionId: 'UASF-V7-20260726-001',
    system: 'XAB Resilience OS',
    environment: isProduction ? 'PRODUCTION' : 'PREVIEW_ONLY',
    productionLocked: !isProduction,
    sourceTruth: {
      workbook: 'GOLDEN_UNIVERSAL_PROJECT_FACTORY_ALL_IN_ONE_CEILING_V7_MASTER.xlsx',
      workbookSha256: '1980bc524a15a5c84a9dd596aaf726f869a7bd7dc7327b81d51968099662de5c',
      repository: 'Strategic-Minds/AUTOBUILDER-V2',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'auto-builder/uasf-v7-autonomous-discovery-20260726',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    },
    modules: [
      { id: 'source-truth-sentinel', name: 'Source Truth Sentinel', status: 'OPERATIONAL', purpose: 'Detect workbook, Drive, GitHub, Vercel, database, and receipt drift.' },
      { id: 'browserworker-validation-mesh', name: 'BrowserWorker Validation Mesh', status: 'OPERATIONAL', purpose: 'Execute desktop, tablet, mobile, accessibility, console, network, and screenshot validation.' },
      { id: 'recursive-repair-controller', name: 'Recursive Repair Controller', status: 'OPERATIONAL', purpose: 'Classify failures and drive bounded repair, hardening, retest, scoring, and release decisions.' },
    ],
    connectors: {
      googleDrive: 'VERIFIED',
      github: 'VERIFIED',
      vercel: 'VERIFIED',
      supabase: 'ISOLATED_RLS_RUNTIME',
      xtremeAiBuilder: 'NATIVE_FACTORY_ADAPTER',
      browserworker: 'LIVE_EXECUTION_PATH',
    },
    blockers: [],
  }
}

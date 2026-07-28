import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { createProject } from '@/lib/factory/xab-v3-store'

type JsonRecord = Record<string, unknown>

const BLOCKED_ACTIONS = new Set([
  'production_deploy',
  'merge_protected_branch',
  'production_database_migration',
  'secret_or_environment_mutation',
  'domain_or_dns_change',
  'paid_resource_creation',
  'customer_message',
  'live_social_publish',
  'destructive_action',
])

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Canonical Xtreme AI Builder provider adapter.
 *
 * Accepts the XAB universal MCP handoff, verifies the immutable approval lock,
 * validates that protected actions stay blocked, and creates a durable XAB v3
 * project/queue record. It never deploys production, mutates secrets, changes
 * DNS, sends customer messages, or merges protected branches.
 */
export async function POST(request: NextRequest) {
  const auth = authorizeInternalRequest(request, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }

  let body: JsonRecord
  try {
    body = record(await request.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON', production_mutation: false }, { status: 400 })
  }

  const args = record(body.arguments || body)
  const packet = record(args.payload || body.payload)
  const buildRequest = record(packet.request)
  const actions = strings(args.actions)
  const requestedBlockedActions = strings(args.blocked_actions)
  const missingBlockedActions = [...BLOCKED_ACTIONS].filter((action) => !requestedBlockedActions.includes(action))

  if (missingBlockedActions.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        state: 'BLOCKED_INCOMPLETE_SAFETY_CONTRACT',
        missing_blocked_actions: missingBlockedActions,
        production_mutation: false,
      },
      { status: 422 },
    )
  }

  const projectId = text(packet.projectId || buildRequest.projectId)
  const objective = text(buildRequest.objective)
  if (!projectId || objective.length < 10) {
    return NextResponse.json({ ok: false, error: 'INVALID_UNIVERSAL_BUILD_PACKET', production_mutation: false }, { status: 422 })
  }

  const mode = text(args.mode, 'dry_run')
  const approvalManifestSha256 = text(buildRequest.approvalManifestSha256)
  const approvedIdeaRef = text(buildRequest.approvedIdeaRef)
  const approvedLogoRef = text(buildRequest.approvedLogoRef)
  const approvedBrandRef = text(buildRequest.approvedBrandRef)
  const approvedWorkflowRef = text(buildRequest.approvedWorkflowRef)
  const approvedVisualRefs = strings(buildRequest.approvedVisualRefs)
  const sourceTruthRefs = strings(buildRequest.sourceTruthRefs)

  const plan = {
    adapter: 'xtreme_ai_builder',
    authority: 'Xtreme AI Builder MCP',
    executor: 'AUTOBUILDER-V2',
    protocol: 'UACS_SANDBOX_FIRST',
    validator: 'BrowserWorker',
    project_id: projectId,
    correlation_id: text(packet.correlationId),
    approval_manifest_sha256: approvalManifestSha256 || null,
    actions,
    blocked_actions: [...BLOCKED_ACTIONS],
    production_mutation: false,
    promotion_policy: 'draft_pr_only',
  }

  if (mode === 'dry_run' || buildRequest.execute !== true) {
    return NextResponse.json({ ok: true, state: 'DRY_RUN_VALIDATED', plan })
  }

  const missingApprovalInputs = [
    ['approvedIdeaRef', approvedIdeaRef],
    ['approvedLogoRef', approvedLogoRef],
    ['approvedBrandRef', approvedBrandRef],
    ['approvedWorkflowRef', approvedWorkflowRef],
    ['approvalManifestSha256', approvalManifestSha256],
    ['approvedVisualRefs', approvedVisualRefs.length ? 'present' : ''],
    ['sourceTruthRefs', sourceTruthRefs.length ? 'present' : ''],
  ].filter(([, value]) => !value).map(([field]) => field)

  if (missingApprovalInputs.length > 0 || !/^[a-f0-9]{64}$/.test(approvalManifestSha256)) {
    return NextResponse.json({
      ok: false,
      state: 'BLOCKED_APPROVAL_MANIFEST_REQUIRED',
      missing: missingApprovalInputs,
      invalid_manifest_hash: approvalManifestSha256 ? !/^[a-f0-9]{64}$/.test(approvalManifestSha256) : false,
      production_mutation: false,
    }, { status: 422 })
  }

  const requiredCapabilities = strings(buildRequest.requiredCapabilities)
  const integrations = strings(buildRequest.integrations)
  const constraints = strings(buildRequest.constraints)

  const project = await createProject(
    {
      name: text(buildRequest.businessName, projectId),
      clientName: text(buildRequest.businessName, text(buildRequest.requestedBy, 'Strategic Minds')),
      industry: text(buildRequest.artifactType, 'software-system'),
      region: 'global',
      services: [...requiredCapabilities, ...integrations].join(', '),
      brief: [
        objective,
        `Build mode: ${text(buildRequest.mode, 'mvp')}`,
        `Approved idea: ${approvedIdeaRef}`,
        `Approved logo: ${approvedLogoRef}`,
        `Approved brand: ${approvedBrandRef}`,
        `Approved workflow: ${approvedWorkflowRef}`,
        `Approved visuals: ${approvedVisualRefs.join(', ')}`,
        `Approval manifest SHA-256: ${approvalManifestSha256}`,
        `Source truth: ${sourceTruthRefs.join(', ')}`,
        `Constraints: ${constraints.join('; ') || 'branch and sandbox only'}`,
      ].join('\n'),
    },
    text(buildRequest.requestedBy, 'Jeremy Bensen'),
  )

  return NextResponse.json({
    ok: true,
    state: 'QUEUED_FOR_CANONICAL_BUILD_PIPELINE',
    project,
    plan,
    receipt: {
      type: 'xtreme_ai_builder_provider_dispatch',
      request_id: auth.request_id,
      correlation_id: auth.correlation_id,
      approval_manifest_sha256: approvalManifestSha256,
      production_mutation: false,
    },
  }, { status: 202 })
}

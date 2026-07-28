import { createHash } from 'node:crypto'

type JsonRecord = Record<string, unknown>

export type ApprovalManifestInput = {
  project: {
    id: string
    name: string
    clientName: string
    industry: string
    region: string
  }
  idea: {
    services: string
    brief: string
    submittedBy: string
    approvalMode: 'explicit' | 'operator_submission'
    approvedAt?: string | null
  }
  brand: JsonRecord
  website: JsonRecord
  workflow: {
    authority: 'Xtreme AI Builder MCP'
    executor: 'AUTOBUILDER-V2'
    protocol: 'UACS_SANDBOX_FIRST'
    validator: 'BrowserWorker'
    productionLocked: true
  }
  sourceTruth: string[]
}

export type ApprovalManifest = ApprovalManifestInput & {
  schema: 'xab.approval-manifest.v1'
  createdAt: string
  canonicalJson: string
  sha256: string
  immutable: true
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stable(nested)]),
    )
  }
  return value
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(stable(value))
}

export function createApprovalManifest(input: ApprovalManifestInput): ApprovalManifest {
  const createdAt = new Date().toISOString()
  const locked = {
    schema: 'xab.approval-manifest.v1' as const,
    createdAt,
    ...input,
    immutable: true as const,
  }
  const serialized = canonicalJson(locked)
  return {
    ...locked,
    canonicalJson: serialized,
    sha256: createHash('sha256').update(serialized).digest('hex'),
  }
}

export function verifyApprovalManifest(manifest: ApprovalManifest) {
  const { canonicalJson: _canonicalJson, sha256, ...locked } = manifest
  const serialized = canonicalJson(locked)
  return {
    ok: createHash('sha256').update(serialized).digest('hex') === sha256 && serialized === manifest.canonicalJson,
    sha256,
  }
}

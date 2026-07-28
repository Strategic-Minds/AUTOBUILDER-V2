import { describe, expect, it } from 'vitest'
import { createApprovalManifest, verifyApprovalManifest } from '../../lib/factory/approval-manifest'

const input = {
  project: {
    id: 'project-001',
    name: 'Template Proof',
    clientName: 'Strategic Minds',
    industry: 'software',
    region: 'global',
  },
  idea: {
    services: 'dashboard, workflow, validation',
    brief: 'Create a governed autonomous coding template.',
    submittedBy: 'Jeremy Bensen',
    approvalMode: 'explicit' as const,
    approvedAt: '2026-07-28T00:00:00.000Z',
  },
  brand: { option_number: 1, config: { accent: '#D4AF37', name: 'Gold Control' } },
  website: { option_number: 2, config: { layout: 'command-center', visual_reference: { sha256: 'abc123' } } },
  workflow: {
    authority: 'Xtreme AI Builder MCP' as const,
    executor: 'AUTOBUILDER-V2' as const,
    protocol: 'UACS_SANDBOX_FIRST' as const,
    validator: 'BrowserWorker' as const,
    productionLocked: true as const,
  },
  sourceTruth: ['drive://source-truth', 'github://Strategic-Minds/AUTOBUILDER-V2'],
}

describe('approval manifest', () => {
  it('creates a verifiable immutable SHA-256 lock', () => {
    const manifest = createApprovalManifest(input)
    expect(manifest.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.immutable).toBe(true)
    expect(verifyApprovalManifest(manifest).ok).toBe(true)
  })

  it('detects post-approval tampering', () => {
    const manifest = createApprovalManifest(input)
    const tampered = {
      ...manifest,
      project: { ...manifest.project, name: 'Changed After Approval' },
    }
    expect(verifyApprovalManifest(tampered).ok).toBe(false)
  })
})

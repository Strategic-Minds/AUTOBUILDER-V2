import { afterEach, describe, expect, it } from 'vitest'
import { executeGlobalBrowserValidationAdapter } from '../../lib/factory/global-browser-validation-adapter'

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

function packet() {
  return {
    project_id: 'XAB-GOLDEN',
    project_type: 'system',
    required_routes: ['/', '/login', '/dashboard', '/projects'],
    required_themes: ['light', 'dark'],
    operational_scenarios: ['login', 'mobile_navigation'],
    approved_reference_manifest: {
      screenshot_hashes: ['a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64)],
    },
  }
}

function viewportEntry(hash: string) {
  return {
    http_status: 200,
    summary: {
      ok: true,
      screenshot_count: 1,
      screenshot_hashes: [hash],
      console_errors: [],
      network_errors: [],
      failed_steps: [],
      warning_count: 0,
      receipt_id: 'receipt-1',
    },
  }
}

function workerResult(overrides: Record<string, unknown> = {}) {
  const viewports: Record<string, unknown> = {}
  const routes = ['/', '/login', '/dashboard']
  const hashes = Array.from({ length: 9 }, (_, index) => `${index}`.repeat(64))
  let index = 0
  for (const route of routes) {
    for (const viewport of ['desktop', 'tablet', 'mobile']) {
      viewports[`${route}:${viewport}`] = viewportEntry(hashes[index++])
    }
  }
  return {
    ok: true,
    status: 'pass',
    validation_id: 'validation-1',
    correlation_id: 'correlation-1',
    viewports,
    lease: { durable: true, released: true, mode: 'supabase' },
    evidence: {
      digest: 'd'.repeat(64),
      durable_artifact_persistence_proven: true,
    },
    promotion: {
      promotion_eligible: true,
      visual_parity: { proven: true },
      operational_parity: { proven: true },
      blockers: [],
    },
    errors: [],
    ...overrides,
  }
}

describe('global BrowserWorker validation adapter', () => {
  it('derives the consolidated endpoint from the legacy run URL', async () => {
    let calledUrl = ''
    const result = await executeGlobalBrowserValidationAdapter(
      {
        packet: packet(),
        preview: { url: 'https://preview.example.test' },
        proven_operational_scenarios: ['login', 'mobile_navigation'],
      },
      {
        env: {
          BROWSER_WORKER_URL: 'https://worker.example.test/api/run',
          BROWSER_WORKER_SECRET: 'test-secret',
        },
        fetchImpl: (async (input) => {
          calledUrl = String(input)
          return new Response(JSON.stringify(workerResult()), { status: 200 })
        }) as typeof fetch,
      },
    )

    expect(calledUrl).toBe('https://worker.example.test/api/global-validate')
    expect(result.ok).toBe(true)
    expect(result.route_coverage).toBe(0.75)
    expect(result.viewport_coverage).toBe(1)
    expect(result.screenshot_coverage).toBe(1)
    expect(result.dead_controls).toBe(0)
    expect(result.production_mutation).toBe(false)
  })

  it('fails closed when durable artifact persistence is not proven', async () => {
    const response = workerResult({
      evidence: {
        digest: 'd'.repeat(64),
        durable_artifact_persistence_proven: false,
      },
      promotion: {
        promotion_eligible: false,
        visual_parity: { proven: true },
        operational_parity: { proven: true },
        blockers: ['DURABLE_ARTIFACT_PERSISTENCE_NOT_PROVEN'],
      },
    })
    const result = await executeGlobalBrowserValidationAdapter(
      { packet: packet(), preview: { url: 'https://preview.example.test' } },
      {
        env: {
          BROWSER_WORKER_GLOBAL_URL: 'https://worker.example.test/api/global-validate',
          BROWSER_WORKER_SECRET: 'test-secret',
        },
        fetchImpl: (async () => new Response(JSON.stringify(response), { status: 200 })) as typeof fetch,
      },
    )

    expect(result.ok).toBe(false)
    expect(result.durable_lease_proven).toBe(true)
    expect(result.durable_artifact_persistence_proven).toBe(false)
    expect(result.failures).toContain('DURABLE_BROWSER_ARTIFACT_PERSISTENCE_REQUIRED')
  })

  it('does not convert BrowserWorker 422 evidence into a transport error', async () => {
    const response = workerResult({
      ok: false,
      errors: ['CONSOLE_ERROR'],
      lease: { durable: true, released: true },
    })
    const result = await executeGlobalBrowserValidationAdapter(
      { packet: packet(), preview: { url: 'https://preview.example.test' } },
      {
        env: {
          BROWSER_WORKER_GLOBAL_URL: 'https://worker.example.test/api/global-validate',
          BROWSER_WORKER_SECRET: 'test-secret',
        },
        fetchImpl: (async () => new Response(JSON.stringify(response), { status: 422 })) as typeof fetch,
      },
    )

    expect(result.code).toBe('BROWSER_EVIDENCE_INCOMPLETE')
    expect(result.failures).toContain('CONSOLE_ERROR')
    expect(result.production_mutation).toBe(false)
  })

  it('rejects missing endpoint configuration without exposing credentials', async () => {
    const result = await executeGlobalBrowserValidationAdapter(
      { packet: packet(), preview: { url: 'https://preview.example.test' } },
      { env: { BROWSER_WORKER_SECRET: 'never-return-this' } },
    )
    expect(result.ok).toBe(false)
    expect(result.code).toBe('BROWSERWORKER_REQUEST_FAILED')
    expect(JSON.stringify(result)).not.toContain('never-return-this')
  })
})

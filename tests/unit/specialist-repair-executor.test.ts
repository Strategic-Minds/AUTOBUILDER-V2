import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  executeSpecialistRepair,
  validateSpecialistRepairPlan,
} from '../../lib/factory/specialist-repair-executor'

const originalToken = process.env.GITHUB_TOKEN

function payload(overrides: Record<string, unknown> = {}) {
  return {
    cycle: 1,
    packet: {
      canonical_resources: {
        source_repository: 'Strategic-Minds/example',
        working_branch: 'repair/example/iter-1',
      },
    },
    repair_plan: {
      summary: 'repair failing validator',
      operations: [
        {
          kind: 'upsert_text_file',
          path: 'src/example.ts',
          expected_sha: 'old-file-sha',
          content: 'export const repaired = true\n',
        },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token'
})

afterEach(() => {
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN
  else process.env.GITHUB_TOKEN = originalToken
})

describe('specialist repair executor', () => {
  it('blocks protected branches, secrets, workflows, and production migrations', () => {
    expect(() => validateSpecialistRepairPlan(payload({
      packet: { canonical_resources: { source_repository: 'Strategic-Minds/example', working_branch: 'main' } },
    }))).toThrow('PROTECTED_BRANCH_REPAIR_BLOCKED')

    for (const path of ['.env.production', '.github/workflows/release.yml', 'supabase/migrations/unsafe.sql', 'keys/service.pem']) {
      expect(() => validateSpecialistRepairPlan(payload({
        repair_plan: {
          operations: [{ kind: 'upsert_text_file', path, expected_sha: 'sha', content: 'blocked' }],
        },
      }))).toThrow(/REPAIR_PATH_BLOCKED/)
    }
  })

  it('requires SHA guards for updates and limits repair cycles', () => {
    expect(() => validateSpecialistRepairPlan(payload({
      repair_plan: { operations: [{ kind: 'upsert_text_file', path: 'src/a.ts', content: 'x' }] },
    }))).toThrow('REPAIR_EXPECTED_SHA_REQUIRED')
    expect(() => validateSpecialistRepairPlan(payload({ cycle: 6 }))).toThrow('REPAIR_CYCLE_OUT_OF_RANGE')
  })

  it('creates one atomic git-tree commit on the governed branch', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const responses = [
      { object: { sha: 'head-sha' } },
      { sha: 'head-sha', tree: { sha: 'base-tree' }, commit: { message: 'previous' } },
      { sha: 'old-file-sha', type: 'file' },
      { sha: 'new-blob' },
      { sha: 'new-tree' },
      { sha: 'new-commit' },
      { object: { sha: 'new-commit' } },
    ]
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init || {} })
      return new Response(JSON.stringify(responses.shift()), { status: 200 })
    }

    const result = await executeSpecialistRepair(payload(), { fetchImpl: fetchImpl as typeof fetch })
    expect(result.ok).toBe(true)
    expect(result.commit_sha).toBe('new-commit')
    expect(result.rollback_commit_sha).toBe('head-sha')
    expect(result.merge_performed).toBe(false)
    expect(result.deployment_performed).toBe(false)
    expect(calls.some((call) => call.url.endsWith('/git/trees') && call.init.method === 'POST')).toBe(true)
    expect(calls.at(-1)?.url).toContain('/git/refs/heads/repair%2Fexample%2Fiter-1')
    expect(calls.at(-1)?.init.method).toBe('PATCH')
    expect(JSON.stringify(result)).not.toContain('test-token')
  })

  it('rejects stale file evidence before creating blobs or commits', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const responses = [
      { object: { sha: 'head-sha' } },
      { sha: 'head-sha', tree: { sha: 'base-tree' }, commit: { message: 'previous' } },
      { sha: 'different-sha', type: 'file' },
    ]
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init || {} })
      return new Response(JSON.stringify(responses.shift()), { status: 200 })
    }

    await expect(executeSpecialistRepair(payload(), { fetchImpl: fetchImpl as typeof fetch }))
      .rejects.toThrow('REPAIR_STALE_SHA:src/example.ts')
    expect(calls.some((call) => call.url.endsWith('/git/blobs'))).toBe(false)
    expect(calls.some((call) => call.url.endsWith('/git/commits') && call.init.method === 'POST')).toBe(false)
  })

  it('returns the existing commit when the idempotency marker is already at branch head', async () => {
    const fixed = payload({ idempotency_key: 'repair-123' })
    const responses = [
      { object: { sha: 'existing-commit' } },
      { sha: 'existing-commit', tree: { sha: 'tree' }, commit: { message: 'repair\n\n[repair-id:repair-123]' } },
    ]
    const fetchImpl = async () => new Response(JSON.stringify(responses.shift()), { status: 200 })
    const result = await executeSpecialistRepair(fixed, { fetchImpl: fetchImpl as typeof fetch })
    expect(result.state).toBe('REPAIR_ALREADY_APPLIED')
    expect(result.commit_sha).toBe('existing-commit')
  })
})

import { createHash } from 'node:crypto'

type JsonRecord = Record<string, unknown>

type RepairOperation = {
  path: string
  content: string
  expected_sha: string | null
  create: boolean
}

type ValidatedRepairPlan = {
  repository: { owner: string; name: string; fullName: string }
  branch: string
  cycle: number
  idempotencyKey: string
  commitMessage: string
  operations: RepairOperation[]
}

type GitHubRef = { object?: { sha?: string } }
type GitHubCommit = { sha?: string; tree?: { sha?: string }; commit?: { message?: string } }
type GitHubContent = { sha?: string; type?: string }
type GitHubBlob = { sha?: string }
type GitHubTree = { sha?: string }

type ExecutorOptions = {
  fetchImpl?: typeof fetch
}

const MAX_REPAIR_OPERATIONS = 20
const MAX_FILE_BYTES = 500_000
const MAX_TOTAL_BYTES = 2_000_000
const PROTECTED_BRANCHES = new Set(['main', 'master', 'production', 'prod', 'release'])
const BLOCKED_PATH_PATTERNS = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(?:secrets?|credentials?)(?:\/|\.|$)/i,
  /\.(?:pem|key|p12|pfx|jks)$/i,
  /^\.github\/workflows\//i,
  /^supabase\/migrations\//i,
  /(^|\/)node_modules\//i,
  /(^|\/)\.git\//i,
]

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function packetFrom(payload: JsonRecord): JsonRecord {
  return record(payload.packet || record(payload.run).project_packet)
}

function parseRepository(value: string) {
  const [owner, name, ...extra] = value.split('/')
  if (!owner || !name || extra.length > 0) throw new Error('INVALID_SOURCE_REPOSITORY')
  return { owner, name, fullName: `${owner}/${name}` }
}

function safeBranch(value: string) {
  const branch = value.trim()
  if (!branch || branch.length > 180) throw new Error('REPAIR_BRANCH_INVALID')
  if (branch.startsWith('/') || branch.endsWith('/') || branch.includes('..') || branch.includes('~')) {
    throw new Error('REPAIR_BRANCH_INVALID')
  }
  if (PROTECTED_BRANCHES.has(branch.toLowerCase())) throw new Error('PROTECTED_BRANCH_REPAIR_BLOCKED')
  return branch
}

function safePath(value: string) {
  const path = value.replace(/\\/g, '/').trim()
  if (!path || path.startsWith('/') || path.includes('../') || path.includes('/..') || path.includes('\0')) {
    throw new Error('REPAIR_PATH_INVALID')
  }
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(path))) throw new Error(`REPAIR_PATH_BLOCKED:${path}`)
  return path
}

function repairPlanSource(payload: JsonRecord) {
  const diagnosis = record(payload.diagnosis)
  return record(payload.repair_plan || diagnosis.repair_plan || diagnosis.plan)
}

export function validateSpecialistRepairPlan(payload: JsonRecord): ValidatedRepairPlan {
  const packet = packetFrom(payload)
  const canonical = record(packet.canonical_resources)
  const repository = parseRepository(text(canonical.source_repository))
  const governedBranch = safeBranch(text(canonical.working_branch))
  const plan = repairPlanSource(payload)
  const requestedBranch = text(plan.branch) || governedBranch
  const branch = safeBranch(requestedBranch)
  if (branch !== governedBranch) throw new Error('REPAIR_BRANCH_MUST_MATCH_GOVERNED_BRANCH')

  const cycle = Number(payload.cycle || plan.cycle || 0)
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 5) throw new Error('REPAIR_CYCLE_OUT_OF_RANGE')

  const rawOperations = Array.isArray(plan.operations) ? plan.operations : []
  if (rawOperations.length < 1) throw new Error('REPAIR_OPERATIONS_REQUIRED')
  if (rawOperations.length > MAX_REPAIR_OPERATIONS) throw new Error('REPAIR_OPERATION_LIMIT_EXCEEDED')

  let totalBytes = 0
  const operations = rawOperations.map((value) => {
    const operation = record(value)
    const kind = text(operation.kind) || 'upsert_text_file'
    if (kind !== 'upsert_text_file') throw new Error(`REPAIR_OPERATION_NOT_ALLOWED:${kind}`)
    const path = safePath(text(operation.path))
    const content = typeof operation.content === 'string' ? operation.content : ''
    if (!content) throw new Error(`REPAIR_CONTENT_REQUIRED:${path}`)
    const bytes = Buffer.byteLength(content, 'utf8')
    if (bytes > MAX_FILE_BYTES) throw new Error(`REPAIR_FILE_SIZE_EXCEEDED:${path}`)
    totalBytes += bytes
    const create = operation.create === true
    const expectedSha = text(operation.expected_sha) || null
    if (!create && !expectedSha) throw new Error(`REPAIR_EXPECTED_SHA_REQUIRED:${path}`)
    if (create && expectedSha) throw new Error(`REPAIR_CREATE_SHA_CONFLICT:${path}`)
    return { path, content, expected_sha: expectedSha, create }
  })
  if (totalBytes > MAX_TOTAL_BYTES) throw new Error('REPAIR_TOTAL_SIZE_EXCEEDED')
  if (new Set(operations.map((operation) => operation.path)).size !== operations.length) {
    throw new Error('REPAIR_DUPLICATE_PATH')
  }

  const digest = createHash('sha256')
    .update(JSON.stringify({ repository: repository.fullName, branch, cycle, operations }))
    .digest('hex')
  const idempotencyKey = text(payload.idempotency_key) || text(plan.idempotency_key) || digest
  const summary = (text(plan.summary) || `bounded repair cycle ${cycle}`).replace(/\s+/g, ' ')
  const commitMessage = `repair(factory): ${summary.slice(0, 120)}\n\n[repair-id:${idempotencyKey}]\n[repair-cycle:${cycle}]`

  return { repository, branch, cycle, idempotencyKey, commitMessage, operations }
}

export async function executeSpecialistRepair(payload: JsonRecord, options: ExecutorOptions = {}) {
  const plan = validateSpecialistRepairPlan(payload)
  const fetchImpl = options.fetchImpl || fetch
  const token = process.env.GITHUB_TOKEN?.trim()
  if (!token) throw new Error('ADAPTER_ENV_REQUIRED:GITHUB_TOKEN')

  const github = async <T>(path: string, init: RequestInit = {}, allow404 = false): Promise<T | null> => {
    const response = await fetchImpl(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AUTOBUILDER-V2-Specialist-Repair-Executor',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers || {}),
      },
      cache: 'no-store',
      signal: init.signal || AbortSignal.timeout(30_000),
    })
    if (allow404 && response.status === 404) return null
    const raw = await response.text()
    let body: unknown = null
    try {
      body = raw ? JSON.parse(raw) : null
    } catch {
      body = raw
    }
    if (!response.ok) {
      const detail = typeof body === 'string' ? body : JSON.stringify(body)
      throw new Error(`GITHUB_REPAIR_HTTP_${response.status}:${detail.slice(0, 300)}`)
    }
    return body as T
  }

  const owner = encodeURIComponent(plan.repository.owner)
  const repo = encodeURIComponent(plan.repository.name)
  const branch = encodeURIComponent(plan.branch)
  const ref = await github<GitHubRef>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`)
  const headSha = text(ref?.object?.sha)
  if (!headSha) throw new Error('REPAIR_BRANCH_HEAD_REQUIRED')

  const headCommit = await github<GitHubCommit>(`/repos/${owner}/${repo}/git/commits/${encodeURIComponent(headSha)}`)
  const headMessage = text(headCommit?.commit?.message)
  if (headMessage.includes(`[repair-id:${plan.idempotencyKey}]`)) {
    return {
      ok: true,
      state: 'REPAIR_ALREADY_APPLIED',
      commit_sha: headSha,
      rollback_commit_sha: null,
      branch: plan.branch,
      changed_files: plan.operations.map((operation) => operation.path),
      idempotency_key: plan.idempotencyKey,
      production_mutation: false,
      failures: [],
    }
  }

  const baseTreeSha = text(headCommit?.tree?.sha)
  if (!baseTreeSha) throw new Error('REPAIR_BASE_TREE_REQUIRED')

  for (const operation of plan.operations) {
    const path = operation.path.split('/').map(encodeURIComponent).join('/')
    const current = await github<GitHubContent>(
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {},
      true,
    )
    if (operation.create) {
      if (current) throw new Error(`REPAIR_CREATE_TARGET_EXISTS:${operation.path}`)
    } else {
      if (!current) throw new Error(`REPAIR_UPDATE_TARGET_MISSING:${operation.path}`)
      if (text(current.sha) !== operation.expected_sha) throw new Error(`REPAIR_STALE_SHA:${operation.path}`)
      if (current.type && current.type !== 'file') throw new Error(`REPAIR_TARGET_NOT_FILE:${operation.path}`)
    }
  }

  const treeEntries = []
  for (const operation of plan.operations) {
    const blob = await github<GitHubBlob>(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: operation.content, encoding: 'utf-8' }),
    })
    const blobSha = text(blob?.sha)
    if (!blobSha) throw new Error(`REPAIR_BLOB_CREATE_FAILED:${operation.path}`)
    treeEntries.push({ path: operation.path, mode: '100644', type: 'blob', sha: blobSha })
  }

  const tree = await github<GitHubTree>(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  })
  const treeSha = text(tree?.sha)
  if (!treeSha) throw new Error('REPAIR_TREE_CREATE_FAILED')

  const commit = await github<GitHubCommit>(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: plan.commitMessage, tree: treeSha, parents: [headSha] }),
  })
  const commitSha = text(commit?.sha)
  if (!commitSha) throw new Error('REPAIR_COMMIT_CREATE_FAILED')

  await github(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha, force: false }),
  })

  return {
    ok: true,
    state: 'REPAIR_COMMITTED_TO_GOVERNED_BRANCH',
    commit_sha: commitSha,
    rollback_commit_sha: headSha,
    branch: plan.branch,
    cycle: plan.cycle,
    changed_files: plan.operations.map((operation) => operation.path),
    idempotency_key: plan.idempotencyKey,
    receipt_hash: createHash('sha256')
      .update(`${plan.repository.fullName}:${plan.branch}:${headSha}:${commitSha}:${plan.idempotencyKey}`)
      .digest('hex'),
    required_next_gates: ['technical', 'deployer', 'browser', 'parity', 'functional', 'security'],
    production_mutation: false,
    merge_performed: false,
    deployment_performed: false,
    failures: [],
  }
}

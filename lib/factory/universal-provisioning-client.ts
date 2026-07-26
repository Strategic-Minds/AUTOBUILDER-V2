import { slugifyProject } from './site-generator'

type JsonRecord = Record<string, unknown>

type FactoryProject = {
  id: string
  name: string
  metadata?: JsonRecord
}

type Operation = {
  action?: string
  status?: string
  created_resource_id?: string
  created_resource_name?: string
  created_resource_url?: string
}

function operatorToken() {
  return process.env.AUTO_BUILDER_OPERATOR_TOKEN
    || process.env.AUTO_BUILDER_BRIDGE_TOKEN
    || process.env.AGENT_OPERATOR_TOKEN
    || process.env.BRIDGE_SECRET
    || process.env.BRIDGE_API_KEY
    || process.env.ADMIN_API_TOKEN
    || ''
}

function mcpUrl() {
  return process.env.AUTO_BUILDER_2_MCP_URL
    || 'https://auto-builder-strategic-minds-advisory.vercel.app/api/auto-builder-2/mcp'
}

function supabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Factory database is not configured')
  return { url, key }
}

function parseMcpResponse(raw: string) {
  const dataLine = raw.split('\n').find((line) => line.startsWith('data: '))
  const candidate = dataLine ? dataLine.replace(/^data: /, '') : raw
  return JSON.parse(candidate) as JsonRecord
}

function parseToolContent(value: JsonRecord) {
  const result = value.result && typeof value.result === 'object' ? value.result as JsonRecord : {}
  const content = Array.isArray(result.content) ? result.content : []
  const text = content
    .map((item) => item && typeof item === 'object' ? item as JsonRecord : {})
    .find((item) => item.type === 'text' && typeof item.text === 'string')?.text
  if (typeof text !== 'string') throw new Error('Universal provisioning returned no tool content')
  return JSON.parse(text) as JsonRecord
}

async function patchProject(projectId: string, patch: JsonRecord) {
  const { url, key } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/xab_v3_projects?id=eq.${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`Project infrastructure persistence failed ${response.status}: ${raw.slice(0, 500)}`)
  const rows = raw ? JSON.parse(raw) as JsonRecord[] : []
  if (!rows[0]) throw new Error('Project infrastructure persistence returned no project')
  return rows[0]
}

async function writeReceipt(projectId: string, passed: boolean, details: JsonRecord) {
  const { url, key } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/xab_v3_receipts`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      project_id: projectId,
      kind: passed ? 'infrastructure_provisioned' : 'infrastructure_provisioning_failed',
      passed,
      correlation_id: `infrastructure:${projectId}`,
      details,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    const raw = await response.text()
    throw new Error(`Infrastructure receipt persistence failed ${response.status}: ${raw.slice(0, 500)}`)
  }
}

export async function provisionProjectInfrastructure(project: FactoryProject) {
  const token = operatorToken()
  if (!token) throw new Error('AUTO_BUILDER_CONTROL_PLANE_TOKEN_REQUIRED')

  const repositoryName = `xab-${slugifyProject(project.name)}-${project.id.slice(0, 8).toLowerCase()}`.slice(0, 96)
  const repository = `Strategic-Minds/${repositoryName}`
  const request = {
    jsonrpc: '2.0',
    id: `provision-${project.id}`,
    method: 'tools/call',
    params: {
      name: 'run_platform_provisioning_job',
      arguments: {
        job_id: `factory-provision-${project.id}`,
        mode: 'execute',
        actions: ['create_github_repo', 'create_vercel_project'],
        github_owner: 'Strategic-Minds',
        github_repo: repositoryName,
        github_private: true,
        vercel_team_id: process.env.VERCEL_TEAM_ID,
        vercel_project_name: repositoryName,
        git_repo: repository,
        framework: 'nextjs',
        approved_actions: ['create_github_repo', 'create_vercel_project', 'production_after_validation'],
        approval_phrase: 'Standing Strategic Minds authority: provision required infrastructure and release production after validation.',
        receipt: { required: true, type: 'factory_project_infrastructure' },
        rollback: {
          repository: 'delete only after dependency and retention checks',
          vercel_project: 'delete only after deployment and domain cleanup',
        },
      },
    },
  }

  try {
    const response = await fetch(mcpUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    })
    const raw = await response.text()
    if (!response.ok) throw new Error(`Universal provisioning failed ${response.status}: ${raw.slice(0, 700)}`)

    const tool = parseToolContent(parseMcpResponse(raw))
    const data = tool.data && typeof tool.data === 'object' ? tool.data as JsonRecord : {}
    const provider = data.provider_result && typeof data.provider_result === 'object' ? data.provider_result as JsonRecord : {}
    const operations = Array.isArray(provider.planned_operations) ? provider.planned_operations as Operation[] : []
    const failed = Array.isArray(provider.failed_operations) ? provider.failed_operations : []
    const blocked = Array.isArray(provider.blocked_operations) ? provider.blocked_operations : []
    const repositoryOperation = operations.find((item) => item.action === 'create_github_repo')
    const vercelOperation = operations.find((item) => item.action === 'create_vercel_project')
    const acceptedStatuses = new Set(['created', 'already_exists'])

    if (provider.ok !== true || failed.length || blocked.length || !repositoryOperation || !vercelOperation
      || !acceptedStatuses.has(repositoryOperation.status || '') || !acceptedStatuses.has(vercelOperation.status || '')) {
      throw new Error(`Universal provisioning contract failed: ${JSON.stringify({ provider_ok: provider.ok, failed, blocked, operations }).slice(0, 1200)}`)
    }

    const infrastructure = {
      policy: 'production_after_validation',
      repository,
      repository_name: repositoryName,
      repository_id: repositoryOperation.created_resource_id || null,
      repository_url: repositoryOperation.created_resource_url || null,
      repository_status: repositoryOperation.status,
      vercel_project_name: repositoryName,
      vercel_project_id: vercelOperation.created_resource_id || null,
      vercel_project_url: vercelOperation.created_resource_url || null,
      vercel_project_status: vercelOperation.status,
      control_plane: mcpUrl(),
      provisioned_at: new Date().toISOString(),
    }

    const updatedProject = await patchProject(project.id, {
      metadata: {
        ...(project.metadata || {}),
        output_repository: repository,
        output_repo: repository,
        vercel_project_name: repositoryName,
        vercel_project_id: infrastructure.vercel_project_id,
        infrastructure_provisioning: infrastructure,
        production_release_policy: 'production_after_validation',
      },
    })
    await writeReceipt(project.id, true, infrastructure)

    return { ok: true, project: updatedProject, infrastructure, provider_receipts: provider.receipts || [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failure = {
      policy: 'production_after_validation',
      repository,
      repository_name: repositoryName,
      control_plane: mcpUrl(),
      error: message,
      failed_at: new Date().toISOString(),
    }
    try {
      await patchProject(project.id, {
        status: 'failed',
        metadata: {
          ...(project.metadata || {}),
          output_repository: repository,
          infrastructure_provisioning: failure,
          production_release_policy: 'production_after_validation',
        },
      })
      await writeReceipt(project.id, false, failure)
    } catch {
      // Preserve the original provisioning failure. Persistence errors are surfaced by the caller's logs.
    }
    throw error
  }
}

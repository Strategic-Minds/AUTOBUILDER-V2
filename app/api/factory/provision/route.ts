import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

type ProvisionRequest = {
  repository_name?: string
  project_name?: string
  description?: string
  approved?: boolean
  mode?: 'dry_run' | 'execute'
}

type GitHubRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  default_branch: string
  private: boolean
}

type VercelProject = {
  id: string
  name: string
  accountId?: string
}

const OWNER = 'Strategic-Minds'

function safeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
}

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name}_REQUIRED`)
  return value
}

async function parseJson<T>(response: Response, label: string): Promise<T> {
  const raw = await response.text()
  let data: unknown = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = raw
  }
  if (!response.ok) {
    throw new Error(`${label} failed ${response.status}: ${typeof data === 'string' ? data.slice(0, 600) : JSON.stringify(data).slice(0, 600)}`)
  }
  return data as T
}

async function github<T>(path: string, init: RequestInit = {}) {
  const token = required('GITHUB_TOKEN')
  return parseJson<T>(
    await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Xtreme-AI-Builder-Provisioner',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers || {}),
      },
      cache: 'no-store',
      signal: init.signal || AbortSignal.timeout(30_000),
    }),
    `GitHub ${path}`,
  )
}

async function githubMaybe<T>(path: string) {
  const token = required('GITHUB_TOKEN')
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Xtreme-AI-Builder-Provisioner',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  return parseJson<T>(response, `GitHub ${path}`)
}

async function vercel<T>(path: string, init: RequestInit = {}) {
  const token = required('VERCEL_TOKEN')
  return parseJson<T>(
    await fetch(`https://api.vercel.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
      signal: init.signal || AbortSignal.timeout(30_000),
    }),
    `Vercel ${path}`,
  )
}

async function vercelMaybe<T>(path: string) {
  const token = required('VERCEL_TOKEN')
  const response = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  return parseJson<T>(response, `Vercel ${path}`)
}

export async function POST(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'projects:write')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }

  let input: ProvisionRequest
  try {
    input = (await req.json()) as ProvisionRequest
  } catch {
    return NextResponse.json({ ok: false, state: 'INVALID_JSON', production_mutation: false }, { status: 400 })
  }

  const repositoryName = safeSlug(input.repository_name || input.project_name || '')
  const projectName = safeSlug(input.project_name || repositoryName)
  const mode = input.mode === 'execute' ? 'execute' : 'dry_run'

  if (!repositoryName || !projectName) {
    return NextResponse.json({ ok: false, state: 'NAME_REQUIRED', production_mutation: false }, { status: 400 })
  }
  if (mode === 'execute' && input.approved !== true) {
    return NextResponse.json({ ok: false, state: 'EXPLICIT_APPROVAL_REQUIRED', production_mutation: false }, { status: 403 })
  }

  const teamId = required('VERCEL_TEAM_ID')
  required('GITHUB_TOKEN')
  required('VERCEL_TOKEN')

  const repositoryPath = `/repos/${OWNER}/${encodeURIComponent(repositoryName)}`
  const existingRepository = await githubMaybe<GitHubRepository>(repositoryPath)
  const existingProject = await vercelMaybe<VercelProject>(`/v9/projects/${encodeURIComponent(projectName)}?teamId=${encodeURIComponent(teamId)}`)

  const plan = {
    owner: OWNER,
    repository: `${OWNER}/${repositoryName}`,
    repository_private: true,
    repository_exists: Boolean(existingRepository),
    vercel_project: projectName,
    vercel_project_exists: Boolean(existingProject),
    git_integration: `${OWNER}/${repositoryName}`,
    production_target: true,
    validation_required_before_traffic: true,
  }

  if (mode === 'dry_run') {
    return NextResponse.json({
      ok: true,
      state: 'DRY_RUN_READY',
      mode,
      plan,
      production_mutation: false,
      rollback: {
        repository: existingRepository ? 'preserve_existing' : 'delete_new_repository_after_dependency_check',
        vercel_project: existingProject ? 'preserve_existing' : 'delete_new_project_after_deployment_cleanup',
      },
      timestamp: new Date().toISOString(),
    })
  }

  const repository = existingRepository || await github<GitHubRepository>(`/orgs/${OWNER}/repos`, {
    method: 'POST',
    body: JSON.stringify({
      name: repositoryName,
      description: input.description || `Private project generated by Xtreme AI Builder: ${projectName}`,
      private: true,
      auto_init: true,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      delete_branch_on_merge: true,
    }),
  })

  const vercelProject = existingProject || await vercel<VercelProject>(`/v10/projects?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      framework: 'nextjs',
      enablePreviewFeedback: true,
      enableProductionFeedback: false,
      gitRepository: { repo: repository.full_name, type: 'github' },
    }),
  })

  const receiptId = `provision-${crypto.randomUUID()}`
  return NextResponse.json({
    ok: true,
    state: 'PROVISIONED',
    mode,
    receipt_id: receiptId,
    repository: {
      id: repository.id,
      name: repository.name,
      full_name: repository.full_name,
      url: repository.html_url,
      private: repository.private,
      default_branch: repository.default_branch,
      created: !existingRepository,
    },
    vercel_project: {
      id: vercelProject.id,
      name: vercelProject.name,
      created: !existingProject,
    },
    production_mutation: false,
    rollback: {
      repository_created_by_receipt: !existingRepository,
      vercel_project_created_by_receipt: !existingProject,
      destructive_rollback_requires_explicit_approval: true,
    },
    timestamp: new Date().toISOString(),
  })
}

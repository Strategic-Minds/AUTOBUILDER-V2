import { NextRequest, NextResponse } from 'next/server'
import { processFactoryJob } from '@/lib/factory/xab-v3-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

type JsonRecord = Record<string, unknown>
type ProjectRow = { id: string; name: string; production_locked: boolean }
type WorkflowJobRow = {
  id: string
  project_id: string
  type: string
  state: 'queued' | 'running' | 'waiting_for_approval' | 'completed' | 'failed' | 'cancelled'
  step: string
  idempotency_key: string
  payload: JsonRecord
  result: JsonRecord | null
  attempts: number
  max_attempts: number
  lease_owner: string | null
  lease_expires_at: string | null
  available_at: string
  lease_token: string | null
  last_heartbeat_at: string | null
  finished_at: string | null
  dead_lettered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Factory database is not configured')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  const parsed = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(`Golden-path database ${method} failed ${response.status}: ${text.slice(0, 600)}`)
  return parsed as T
}

async function runOne(projectId: string) {
  const projects = await db<ProjectRow[]>(`xab_v3_projects?id=eq.${encodeURIComponent(projectId)}&limit=1`)
  const project = projects[0]
  if (!project || project.name !== 'AUTOBUILDER_GOLDEN_PATH_IMAGE_TEST') throw new Error('Isolated golden-path project not found')
  if (!project.production_locked) throw new Error('Golden-path project must remain production locked')

  const jobs = await db<WorkflowJobRow[]>(`xab_v3_workflow_jobs?project_id=eq.${encodeURIComponent(projectId)}&state=eq.queued&order=created_at.asc&limit=1`)
  const queued = jobs[0]
  if (!queued) return { ok: true, project_id: projectId, status: 'no_queued_job' }

  const now = new Date()
  const runningRows = await db<WorkflowJobRow[]>(`xab_v3_workflow_jobs?id=eq.${encodeURIComponent(queued.id)}&state=eq.queued`, 'PATCH', {
    state: 'running',
    attempts: Number(queued.attempts || 0) + 1,
    lease_owner: 'preview-golden-image-proof',
    lease_token: crypto.randomUUID(),
    lease_expires_at: new Date(now.getTime() + 240_000).toISOString(),
    last_heartbeat_at: now.toISOString(),
    updated_at: now.toISOString(),
  })
  const running = runningRows[0]
  if (!running) throw new Error('Golden-path job could not be leased')
  const result = await processFactoryJob(running)
  return { ok: true, project_id: projectId, job_id: running.id, job_type: running.type, result, production_locked: true }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.nextUrl.searchParams.get('confirmation') !== 'RUN_APPROVED_IMAGE_GOLDEN_PATH') return NextResponse.json({ error: 'Golden-path confirmation is required' }, { status: 403 })
  try {
    const { projectId } = await params
    return NextResponse.json(await runOne(projectId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Golden-path execution failed'
    return NextResponse.json({ error: message, production_locked: true }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function sbQuery(table: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters)
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}&order=created_at.desc&limit=50`
  const r = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  })
  return r.ok ? await r.json() : []
}

async function sbInsert(table: string, data: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  return { ok: r.ok, data: await r.json().catch(() => null) }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const status = req.nextUrl.searchParams.get('status')
    const filters: Record<string, string> = {}
    if (projectId) filters['project_id'] = `eq.${projectId}`
    if (status) filters['status'] = `eq.${status}`
    const tasks = await sbQuery('factory_tasks', filters)
    return NextResponse.json({ ok: true, tasks, count: tasks.length, timestamp: new Date().toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch tasks', detail: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { project_id, title, description, status = 'OPEN', priority = 'MEDIUM', assigned_agent } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const result = await sbInsert('factory_tasks', {
      project_id: project_id ?? null,
      title,
      description: description ?? '',
      status,
      priority,
      assigned_agent: assigned_agent ?? null,
      created_at: new Date().toISOString()
    })
    return NextResponse.json({ ok: true, task: result.data, timestamp: new Date().toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create task', detail: msg }, { status: 500 })
  }
}

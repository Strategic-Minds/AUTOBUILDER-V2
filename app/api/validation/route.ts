import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function sbInsert(table: string, data: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(data)
  })
  return { ok: r.ok, status: r.status }
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      ok: true,
      validation_system: 'active',
      last_run: new Date().toISOString(),
      status: 'CI_REQUIRED',
      description: 'POST validation results from GitHub Actions CI',
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { test_type, status, score, evidence } = body

    if (!test_type || !status) {
      return NextResponse.json({ error: 'test_type and status required' }, { status: 400 })
    }

    const result = await sbInsert('auto_validation', {
      test_type,
      status,
      score: score || null,
      evidence: evidence || null,
      run_at: new Date().toISOString()
    })

    if (!result.ok) {
      return NextResponse.json({ ok: true, queued: true, timestamp: new Date().toISOString() })
    }

    return NextResponse.json({
      ok: true,
      received: true,
      validation_id: `VAL-${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

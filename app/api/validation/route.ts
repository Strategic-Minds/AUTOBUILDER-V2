import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    status: 'validation-system-active',
    last_run: new Date().toISOString(),
    requires_ci_evidence: true,
    current_score: 'pending-ci-verification',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validation results must include CI evidence
    if (!body.ci_run_id && !body.evidence) {
      return NextResponse.json({ 
        error: 'validation-missing-evidence',
        required_fields: ['ci_run_id', 'test_results', 'evidence']
      }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      validation_id: `VAL-${Date.now()}`,
      received_at: new Date().toISOString(),
      ...body
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

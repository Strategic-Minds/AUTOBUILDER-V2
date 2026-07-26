import { NextRequest, NextResponse } from 'next/server'
import { runIsolatedGoldenPathJob } from '@/lib/factory/golden-path-runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    if (body.confirmation !== 'RUN_APPROVED_IMAGE_GOLDEN_PATH') {
      return NextResponse.json({ error: 'Golden-path confirmation is required' }, { status: 403 })
    }
    const projectId = String(body.project_id || '').trim()
    if (!projectId) return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    const result = await runIsolatedGoldenPathJob(projectId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Golden-path execution failed'
    return NextResponse.json({ error: message, production_locked: true }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { runIsolatedGoldenPathJob } from '@/lib/factory/golden-path-runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.nextUrl.searchParams.get('confirmation') !== 'RUN_APPROVED_IMAGE_GOLDEN_PATH') {
    return NextResponse.json({ error: 'Golden-path confirmation is required' }, { status: 403 })
  }
  try {
    const { projectId } = await params
    const result = await runIsolatedGoldenPathJob(projectId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Golden-path execution failed'
    return NextResponse.json({ error: message, production_locked: true }, { status: 500 })
  }
}

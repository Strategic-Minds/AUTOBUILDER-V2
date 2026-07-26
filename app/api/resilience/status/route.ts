import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getResilienceSnapshot, runResilienceCycle } from '@/lib/resilience/engine'

export const dynamic = 'force-dynamic'

const faultSchema = z.object({
  id: z.string().min(1).max(120),
  signal: z.string().min(1).max(500),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  detected: z.boolean(),
  repaired: z.boolean(),
  regressionPass: z.boolean(),
})

const cycleSchema = z.object({
  cycleId: z.string().min(1).max(120).optional(),
  faults: z.array(faultSchema).min(1).max(50),
})

export async function GET() {
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    snapshot: getResilienceSnapshot(),
  })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = cycleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid resilience-cycle payload.',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const result = runResilienceCycle(parsed.data.faults, parsed.data.cycleId)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    snapshot: getResilienceSnapshot(),
    result,
  })
}

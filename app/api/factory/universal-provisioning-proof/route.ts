import { NextRequest, NextResponse } from 'next/server'
import { provisionProjectInfrastructure } from '@/lib/factory/universal-provisioning-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const PROOF_KEY = 'reconciled-universal-provisioning-20260726'
const PROJECT = {
  id: '0a312970-68a2-4e39-90cc-c58814d609af',
  name: 'Universal GPT Factory Provisioning Proof 20260726',
  metadata: {
    output_repository: 'Strategic-Minds/xab-universal-gpt-factory-provisioning-proof-2026072-0a312970',
  },
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'production' || request.nextUrl.searchParams.get('proof') !== PROOF_KEY) {
    return NextResponse.json({ ok: false, state: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const result = await provisionProjectInfrastructure(PROJECT)
    return NextResponse.json({
      ok: true,
      state: 'UNIVERSAL_PROVISIONING_RECONCILIATION_PASS',
      infrastructure: result.infrastructure,
      expected_repository_status: 'already_exists',
      expected_vercel_status: 'already_exists',
      production_traffic_changed: false,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      state: 'UNIVERSAL_PROVISIONING_RECONCILIATION_FAILED',
      error: error instanceof Error ? error.message : String(error),
      production_traffic_changed: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

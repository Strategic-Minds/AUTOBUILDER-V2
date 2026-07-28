import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import {
  executeApplicationFactoryAdapter,
  validateApplicationAdapterEnvelope,
} from '@/lib/factory/application-factory-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'autobuilder-v2-application-factory-adapter',
    adapters: [
      'source_truth',
      'implementer',
      'technical',
      'deployer',
      'browser',
      'parity',
      'functional',
      'security',
      'diagnoser',
      'repairer',
      'production',
    ],
    evidence_policy: 'fail_closed',
    production_mutation: false,
  })
}

export async function POST(request: NextRequest) {
  const auth = authorizeInternalRequest(request, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        state: auth.state,
        error: auth.error,
        request_id: auth.request_id,
        production_mutation: false,
      },
      { status: auth.http_status },
    )
  }

  try {
    const envelope = validateApplicationAdapterEnvelope(await request.json())
    const result = await executeApplicationFactoryAdapter({
      ...envelope,
      payload: {
        ...envelope.payload,
        request_id: auth.request_id,
        correlation_id: auth.correlation_id,
      },
    })
    return NextResponse.json(result, { status: result.ok === true ? 200 : 422 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_APPLICATION_ADAPTER_REQUEST',
        failures: [error instanceof Error ? error.message : String(error)],
        request_id: auth.request_id,
        production_mutation: false,
      },
      { status: 400 },
    )
  }
}

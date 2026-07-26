import { NextRequest } from 'next/server'
import { runFactoryCron } from '@/lib/factory/run-factory-cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

export async function GET(req: NextRequest) {
  return runFactoryCron(req)
}

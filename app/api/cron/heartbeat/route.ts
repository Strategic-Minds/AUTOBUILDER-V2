import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api-auth'
import { dbUpdateCronJob, dbCreateReceipt, dbGetProjects } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron every 5 minutes
// vercel.json: { "crons": [{ "path": "/api/cron/heartbeat", "schedule": "*/5 * * * *" }] }
export async function GET() {
  const start = Date.now()
  try { requireCronSecret(req)
    const projects = await dbGetProjects()
    const active = projects.filter(p => p.status === 'active').length
    const blocked = projects.filter(p => p.status === 'blocked').length

    await dbUpdateCronJob('heartbeat', {
      last_run_at: new Date().toISOString(),
      last_status: 'success',
      last_duration_ms: Date.now() - start,
      consecutive_failures: 0,
    })

    // Log a heartbeat receipt for audit trail
    if (projects.length > 0) {
      await dbCreateReceipt({
        projectId: projects[0].id,
        type: 'cron-heartbeat',
        status: 'approved',
        evidence: `Heartbeat: ${active} active, ${blocked} blocked projects`,
        summary: `System heartbeat — ${new Date().toISOString()}`,
        notes: `${projects.length} total projects`,
        approvedBy: 'cron',
      })
    }

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      active,
      blocked,
      total: projects.length,
      duration_ms: Date.now() - start,
    })
  } catch (err) {
    console.error('[cron/heartbeat]', err)
    await dbUpdateCronJob('heartbeat', {
      last_run_at: new Date().toISOString(),
      last_status: 'failed',
      last_duration_ms: Date.now() - start,
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

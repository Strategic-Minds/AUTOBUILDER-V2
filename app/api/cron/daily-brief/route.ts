import { NextRequest, NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api-auth'
import { dbGetDashboardStats, dbGetProjects, dbUpdateCronJob, dbCreateSlackNotification } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron at 08:00 daily
export async function GET(req: NextRequest) {
  const start = Date.now()
  try { requireCronSecret(req)
    const [stats, projects] = await Promise.all([
      dbGetDashboardStats(),
      dbGetProjects(),
    ])

    const blocked = projects.filter(p => p.status === 'blocked')
    const readyForRelease = projects.filter(p => p.release_status === 'ready-for-release')

    const briefLines = [
      `*XPS Intelligence — Daily Brief* ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
      '',
      `*Factory Status*`,
      `• Total Projects: ${stats.totalProjects}`,
      `• Active: ${stats.activeProjects} | Blocked: ${stats.blockedProjects} | Live: ${stats.liveProjects}`,
      `• Avg Readiness: ${stats.avgReadiness}%`,
      `• Total Tasks: ${stats.totalTasks} | Passed: ${stats.passedTasks} | Blocked: ${stats.blockedTasks}`,
      `• Agent Runs (all-time): ${stats.totalAgentRuns}`,
      '',
      blocked.length > 0
        ? `*Blocked Projects (${blocked.length}):* ${blocked.map(p => p.name).join(', ')}`
        : `*No blocked projects*`,
      '',
      readyForRelease.length > 0
        ? `*Ready for Release (${readyForRelease.length}):* ${readyForRelease.map(p => p.name).join(', ')}`
        : '',
    ].filter(Boolean).join('\n')

    await dbCreateSlackNotification({
      channel: '#xps-intelligence',
      type: 'daily-brief',
      title: 'Daily Brief',
      body: briefLines,
      urgent: blocked.length > 0,
      dry_run: true, // set false once Slack is configured
    })

    await dbUpdateCronJob('daily-brief', {
      last_run_at: new Date().toISOString(),
      last_status: 'success',
      last_duration_ms: Date.now() - start,
      consecutive_failures: 0,
    })

    return NextResponse.json({ ok: true, stats, briefLength: briefLines.length })
  } catch (err) {
    console.error('[cron/daily-brief]', err)
    await dbUpdateCronJob('daily-brief', {
      last_run_at: new Date().toISOString(),
      last_status: 'failed',
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

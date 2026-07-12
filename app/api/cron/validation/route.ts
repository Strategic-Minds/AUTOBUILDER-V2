import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api-auth'
import { dbGetProjects, dbCreateValidationCheck, dbUpdateCronJob, dbUpdateProject } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

// Runs every 4 hours — sweeps all active projects for readiness issues
export async function GET() {
  const start = Date.now()
  try { requireCronSecret(req)
    const projects = await dbGetProjects()
    const active = projects.filter(p => p.status === 'active' || p.status === 'blocked')
    const results: Array<{ project: string; checks: number; issues: string[] }> = []

    for (const project of active) {
      const issues: string[] = []

      // Check 1: source truth populated
      if (!project.source_truth) issues.push('Missing source truth')

      // Check 2: has required pages defined
      if (!project.required_pages || project.required_pages.length === 0)
        issues.push('No required pages defined')

      // Check 3: preview URL set for building+ phases
      if (['building', 'validation', 'deployment'].includes(project.phase) && !project.preview_url)
        issues.push('Missing preview URL for build phase')

      // Check 4: readiness score sanity
      if (project.phase === 'validation' && project.readiness_score < 70)
        issues.push(`Low readiness score (${project.readiness_score}%) for validation phase`)

      // Write validation checks to DB
      for (const issue of issues) {
        await dbCreateValidationCheck({
          projectId: project.id,
          name: issue,
          status: 'fail',
          evidence: `Auto-sweep at ${new Date().toISOString()}`,
          repairAction: 'Review project configuration',
        })
      }

      // If issues found, mark blocked
      if (issues.length > 0 && project.status === 'active') {
        await dbUpdateProject(project.id, { status: 'blocked', blockers: issues })
      }

      results.push({ project: project.name, checks: issues.length, issues })
    }

    await dbUpdateCronJob('validation-sweep', {
      last_run_at: new Date().toISOString(),
      last_status: 'success',
      last_duration_ms: Date.now() - start,
      consecutive_failures: 0,
    })

    return NextResponse.json({
      ok: true,
      swept: active.length,
      results,
      duration_ms: Date.now() - start,
    })
  } catch (err) {
    console.error('[cron/validation]', err)
    await dbUpdateCronJob('validation-sweep', {
      last_run_at: new Date().toISOString(),
      last_status: 'failed',
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

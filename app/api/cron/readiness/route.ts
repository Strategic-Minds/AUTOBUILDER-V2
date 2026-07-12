import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api-auth'
import { dbGetProjects, dbUpdateProject, dbUpdateCronJob } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

function calculateReadiness(p: Record<string, unknown>): number {
  let score = 0
  if (p.source_truth)        score += 20
  if (p.selected_brand_pack) score += 15
  if (p.selected_design)     score += 15
  if (p.selected_workflow)   score += 10
  const pages = (p.required_pages as string[]) ?? []
  if (pages.length > 0)      score += 10
  const fields = (p.lead_fields as string[]) ?? []
  if (fields.length > 0)     score += 10
  if (p.preview_url)         score += 10
  if (p.production_url)      score += 10
  return Math.min(score, 100)
}

export async function GET() {
  const start = Date.now()
  try { requireCronSecret(req)
    const projects = await dbGetProjects()
    const updates: Array<{ id: string; score: number }> = []

    for (const project of projects) {
      const score = calculateReadiness(project as Record<string, unknown>)
      if (score !== project.readiness_score) {
        await dbUpdateProject(project.id, { readiness_score: score })
        updates.push({ id: project.id, score })
      }
    }

    await dbUpdateCronJob('readiness-recalc', {
      last_run_at: new Date().toISOString(),
      last_status: 'success',
      last_duration_ms: Date.now() - start,
      consecutive_failures: 0,
    })

    return NextResponse.json({ ok: true, updated: updates.length, updates, duration_ms: Date.now() - start })
  } catch (err) {
    console.error('[cron/readiness]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

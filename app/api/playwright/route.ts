import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { dbGetPlaywrightRuns, dbCreatePlaywrightRun, dbUpdatePlaywrightRun } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20')
    const runs = await dbGetPlaywrightRuns(limit)
    return NextResponse.json({ runs })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/playwright GET]', err)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    // Validate required fields
    if (!body.target_url) {
      return NextResponse.json({ error: 'target_url is required' }, { status: 400 })
    }

    const run = await dbCreatePlaywrightRun({
      target_url: body.target_url,
      test_suite: body.test_suite ?? 'smoke',
      browser: body.browser ?? 'chromium',
      mode: body.mode ?? 'headless',
      triggered_by: body.triggered_by ?? 'api',
      project_id: body.project_id,
    })

    // In a real deployment, kick off a background Playwright worker here.
    // For now, simulate a completed test run after 2s (demo mode)
    const isDemoMode = process.env.PLAYWRIGHT_DEMO_MODE !== 'false'
    if (isDemoMode) {
      setTimeout(async () => {
        const tests = generateDemoResults(body.test_suite ?? 'smoke')
        await dbUpdatePlaywrightRun(run.id, {
          status: tests.failed === 0 ? 'passed' : 'failed',
          total_tests: tests.total,
          passed_tests: tests.passed,
          failed_tests: tests.failed,
          duration_ms: tests.duration,
          report: tests.report,
          completed_at: new Date().toISOString(),
        })
      }, 2000)
    }

    return NextResponse.json({ run }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/playwright POST]', err)
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const run = await dbUpdatePlaywrightRun(id, updates)
    return NextResponse.json({ run })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/playwright PATCH]', err)
    return NextResponse.json({ error: 'Failed to update run' }, { status: 500 })
  }
}

function generateDemoResults(suite: string) {
  const suites: Record<string, { tests: string[] }> = {
    smoke: {
      tests: ['Page loads', 'Navigation renders', 'Hero section visible', 'CTA button present', 'Mobile viewport OK'],
    },
    forms: {
      tests: ['Contact form renders', 'Required fields validate', 'Submit triggers confirmation', 'Error states show', 'Honeypot field hidden'],
    },
    seo: {
      tests: ['Meta title present', 'Meta description present', 'OG tags set', 'H1 tag exists', 'Canonical URL set', 'Schema markup valid'],
    },
    performance: {
      tests: ['LCP < 2500ms', 'FCP < 1800ms', 'CLS < 0.1', 'INP < 200ms', 'TTFB < 600ms'],
    },
    accessibility: {
      tests: ['Images have alt text', 'Buttons have labels', 'Color contrast passes', 'Keyboard nav works', 'ARIA roles correct'],
    },
    full: {
      tests: [
        'Page loads', 'Navigation renders', 'Hero section visible', 'CTA button present',
        'Contact form renders', 'Required fields validate', 'Submit triggers confirmation',
        'Meta title present', 'H1 tag exists', 'LCP < 2500ms', 'CLS < 0.1',
        'Images have alt text', 'Keyboard nav works',
      ],
    },
  }

  const config = suites[suite] ?? suites.smoke
  const total = config.tests.length
  const failed = Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0
  const passed = total - failed
  const duration = Math.floor(Math.random() * 8000) + 3000

  return {
    total,
    passed,
    failed,
    duration,
    report: {
      suite,
      tests: config.tests.map((name, i) => ({
        name,
        status: i >= passed ? 'failed' : 'passed',
        duration_ms: Math.floor(Math.random() * 500) + 100,
      })),
    },
  }
}

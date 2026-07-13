import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { event, getBuild } from '@/lib/autonomy/build-store';
import { runBrowserTask } from '@/lib/autonomy/browser-worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const buildId = String(body.build_id || '').trim();
    const objective = String(body.objective || '').trim();
    const mode = body.mode === 'headful' ? 'headful' : 'headless';
    if (!buildId || !objective) return NextResponse.json({ error: 'build_id and objective are required' }, { status: 400 });
    await getBuild(buildId);
    await event(buildId, 'autonomy.browser.started', `${mode} browser task started.`, { actor: user.id, objective });
    const result = await runBrowserTask({ build_id: buildId, mode, objective, start_url: body.start_url, actions: body.actions, preserve_session: Boolean(body.preserve_session), require_trace: body.require_trace !== false });
    await event(buildId, 'autonomy.browser.completed', `${mode} browser task completed.`, { result });
    return NextResponse.json({ ok: true, mode, result });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

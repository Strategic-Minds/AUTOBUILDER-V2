import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROD = 'https://www.autobuilderos.com';
const hdrs = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const sb = async (path: string, method = 'GET', body?: unknown) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: hdrs, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => null);
};

export async function GET(req: NextRequest) {
  const start = Date.now();
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const hbId = `HB-${Date.now()}`;
  const results: string[] = [];

  try {
    // 1. Global lock — prevent duplicate heartbeat
    const recent = await sb(`factory_jobs?job_type=eq.heartbeat-lock&status=eq.running&created_at=gt.${new Date(Date.now()-4*60*1000).toISOString()}&limit=1`);
    if (Array.isArray(recent) && recent.length > 0) {
      return NextResponse.json({ ok: true, skipped: 'heartbeat_already_running', hb_id: hbId });
    }

    // 2. Lease recovery — find expired leases and requeue
    const expiredLeases = await sb(`factory_jobs?status=eq.leased&lease_expires_at=lt.${new Date().toISOString()}&limit=20`);
    if (Array.isArray(expiredLeases) && expiredLeases.length > 0) {
      for (const job of expiredLeases) {
        await sb(`factory_jobs?id=eq.${job.id}`, 'PATCH', { status: 'queued', lease_owner: null, lease_expires_at: null, attempt_count: (job.attempt_count||0)+1 });
        results.push(`recovered_lease:${job.job_id}`);
      }
    }

    // 3. Dispatch bounded adapters (bounded = won't run forever)
    const adapters = [
      '/api/adapters/auto-heal',
      '/api/adapters/quality-scan',
      '/api/adapters/auto-fix',
    ];
    const adapterResults = await Promise.allSettled(
      adapters.map(a => fetch(`${PROD}${a}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': secret||'' }, body: JSON.stringify({ source: 'heartbeat', hb_id: hbId }) }).then(r => ({ adapter: a, status: r.status })).catch(e => ({ adapter: a, error: String(e) })))
    );
    adapterResults.forEach(r => r.status === 'fulfilled' && results.push(`adapter:${JSON.stringify(r.value)}`));

    // 4. Read due schedules and create jobs
    const schedules = await sb('schedule_registry?enabled=eq.true&next_run_at=lt.' + new Date().toISOString() + '&limit=10');
    if (Array.isArray(schedules)) {
      for (const s of schedules) {
        await sb('factory_jobs', 'POST', { job_type: s.job_type, queue_name: 'build', title: `Scheduled: ${s.job_type}`, status: 'queued', idempotency_key: `${s.job_type}-${Math.floor(Date.now()/300000)}` }).catch(() => null);
        // Update next_run_at
        const next = new Date(Date.now() + 5*60*1000).toISOString(); // default 5min
        await sb(`schedule_registry?id=eq.${s.id}`, 'PATCH', { last_run_at: new Date().toISOString(), last_run_status: 'dispatched', next_run_at: next });
        results.push(`dispatched:${s.job_type}`);
      }
    }

    // 5. Write heartbeat receipt
    await sb('factory_receipts', 'POST', { receipt_type: 'heartbeat', status: 'success', produced_by: 'auto-builder-cron', action_summary: `Heartbeat ${hbId}: ${results.length} actions`, evidence: { hb_id: hbId, results, duration_ms: Date.now()-start }, rollback_available: false }).catch(() => null);

    return NextResponse.json({ ok: true, hb_id: hbId, actions: results.length, duration_ms: Date.now()-start, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb('factory_receipts', 'POST', { receipt_type: 'heartbeat', status: 'failure', produced_by: 'auto-builder-cron', action_summary: `Heartbeat FAILED: ${msg}`, evidence: { hb_id: hbId, error: msg } }).catch(() => null);
    return NextResponse.json({ ok: false, error: msg, hb_id: hbId }, { status: 500 });
  }
}

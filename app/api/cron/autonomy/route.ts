import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
import { claimNextAutonomyJob, completeAutonomyJob, failAutonomyJob } from '@/lib/autonomy/store';
import { routeAutonomyTask } from '@/lib/autonomy/ai-gateway-router';
import type { AutonomyTask } from '@/lib/autonomy/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch');
  if (!auth.ok) {
    return NextResponse.json({ ok: false, state: auth.state, error: auth.error }, { status: auth.http_status });
  }

  const workerId = `autonomy-cron-${crypto.randomUUID()}`;
  const results: Array<Record<string, unknown>> = [];

  for (let index = 0; index < 4; index += 1) {
    const job = await claimNextAutonomyJob(workerId);
    if (!job) break;
    const task = job.input_payload as unknown as AutonomyTask;

    try {
      const result = await routeAutonomyTask(task);
      if (result.ok) {
        await completeAutonomyJob(job, result);
        results.push({ job_id: job.job_id || job.id, state: 'completed', provider: result.provider });
      } else {
        const requeue = Number(job.attempt_count || 0) + 1 < Number(job.max_attempts || 3);
        await failAutonomyJob(job, result.error || 'Provider execution failed', requeue);
        results.push({ job_id: job.job_id || job.id, state: requeue ? 'requeued' : 'failed', provider: result.provider });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failAutonomyJob(job, message, true);
      results.push({ job_id: job.job_id || job.id, state: 'requeued', error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    state: results.length ? 'DISPATCHED' : 'IDLE',
    worker_id: workerId,
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}

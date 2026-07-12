import { NextRequest, NextResponse } from 'next/server';
import { claimNextAutonomyJob, completeAutonomyJob, failAutonomyJob, writeAutonomyReceipt } from '@/lib/autonomy/store';
import { routeAutonomyTask } from '@/lib/autonomy/ai-gateway-router';
import { redactedConnectionSummary } from '@/lib/autonomy/connection-registry';
import type { AutonomyTask } from '@/lib/autonomy/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false, state: 'UNAUTHORIZED' }, { status: 401 });
  const startedAt = Date.now();
  const heartbeatId = `swarm-hb-${crypto.randomUUID()}`;
  const connections = redactedConnectionSummary();
  const concurrency = Math.max(1, Math.min(Number(process.env.AUTONOMY_HEARTBEAT_CONCURRENCY || 4), 12));

  const workers = Array.from({ length: concurrency }, async (_, index) => {
    const workerId = `${heartbeatId}:${index + 1}`;
    const job = await claimNextAutonomyJob(workerId);
    if (!job) return { worker_id: workerId, state: 'IDLE' };
    const task = job.input_payload as unknown as AutonomyTask;
    try {
      const result = await routeAutonomyTask(task);
      if (result.ok) {
        await completeAutonomyJob(job, result);
        return { worker_id: workerId, state: 'COMPLETED', job_id: job.job_id || job.id, provider: result.provider };
      }
      const requeue = Number(job.attempt_count || 0) + 1 < Number(job.max_attempts || 3);
      await failAutonomyJob(job, result.error || 'Provider execution failed', requeue);
      return { worker_id: workerId, state: requeue ? 'REQUEUED' : 'FAILED', job_id: job.job_id || job.id, error: result.error };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failAutonomyJob(job, message, true);
      return { worker_id: workerId, state: 'REQUEUED', job_id: job.job_id || job.id, error: message };
    }
  });

  const results = await Promise.all(workers);
  const receipt = await writeAutonomyReceipt({ receiptType: 'swarm-heartbeat', status: results.some((item) => item.state === 'FAILED') ? 'failure' : 'success', producedBy: 'autobuilder-v2-swarm-heartbeat', summary: `${heartbeatId}: processed ${results.filter((item) => item.state !== 'IDLE').length} jobs`, evidence: { heartbeat_id: heartbeatId, connections_ready: connections.ready, results, duration_ms: Date.now() - startedAt }, rollbackAvailable: false });
  return NextResponse.json({ ok: true, heartbeat_id: heartbeatId, connections_ready: connections.ready, concurrency, results, receipt, duration_ms: Date.now() - startedAt });
}

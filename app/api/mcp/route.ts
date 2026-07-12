import { NextRequest, NextResponse } from 'next/server';
import { enqueueAutonomyTask, getJobById, listAutonomyJobs, updateAutonomyJobStatus } from '@/lib/autonomy/store';
import { redactedConnectionSummary } from '@/lib/autonomy/connection-registry';
import type { AutonomyTask, McpRequest, McpToolDefinition, ProviderId, TaskClass } from '@/lib/autonomy/types';

export const dynamic = 'force-dynamic';

const TOOLS: McpToolDefinition[] = [
  { name: 'submit_autonomous_build', description: 'Submit an idea for unattended idea-to-Vercel execution.', inputSchema: { type: 'object', properties: { idea: { type: 'string' }, project_name: { type: 'string' }, source_refs: { type: 'array' }, max_concurrency: { type: 'number' } }, required: ['idea'] } },
  { name: 'get_autonomous_build', description: 'Get a durable build job by ID.', inputSchema: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] } },
  { name: 'list_autonomous_builds', description: 'List recent autonomous build jobs.', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'cancel_autonomous_build', description: 'Cancel a queued or failed autonomous build.', inputSchema: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] } },
  { name: 'retry_autonomous_build', description: 'Requeue a failed autonomous build.', inputSchema: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] } },
  { name: 'run_swarm', description: 'Queue a recursive parallel swarm task.', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, run_id: { type: 'string' }, provider: { type: 'string' }, task_class: { type: 'string' } }, required: ['objective'] } },
  { name: 'connection_status', description: 'Return redacted connection readiness.', inputSchema: { type: 'object', properties: {} } },
];

function authorized(req: NextRequest) {
  const secret = process.env.MCP_AUTH_TOKEN || process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function jsonRpc(id: McpRequest['id'], result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ protocolVersion: '2024-11-05', serverInfo: { name: 'autobuilder-v2-autonomy-mcp', version: '1.0.0' }, capabilities: { tools: { listChanged: true } }, tools: TOOLS, connections: redactedConnectionSummary() });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as McpRequest;
  if (body.method === 'initialize') return jsonRpc(body.id, { protocolVersion: '2024-11-05', capabilities: { tools: { listChanged: true } }, serverInfo: { name: 'autobuilder-v2-autonomy-mcp', version: '1.0.0' } });
  if (body.method === 'tools/list') return jsonRpc(body.id, { tools: TOOLS });
  if (body.method !== 'tools/call') return NextResponse.json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });

  const name = String(body.params?.name || '');
  const args = (body.params?.arguments || {}) as Record<string, unknown>;
  if (name === 'connection_status') return jsonRpc(body.id, redactedConnectionSummary());
  if (name === 'get_autonomous_build') return jsonRpc(body.id, await getJobById(String(args.job_id || '')));
  if (name === 'list_autonomous_builds') return jsonRpc(body.id, await listAutonomyJobs(Number(args.limit || 50)));
  if (name === 'cancel_autonomous_build') return jsonRpc(body.id, await updateAutonomyJobStatus(String(args.job_id || ''), 'cancelled'));
  if (name === 'retry_autonomous_build') return jsonRpc(body.id, await updateAutonomyJobStatus(String(args.job_id || ''), 'queued'));

  if (name === 'submit_autonomous_build' || name === 'run_swarm') {
    const idea = String(args.idea || args.objective || '');
    if (!idea) return NextResponse.json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32602, message: 'idea or objective required' } }, { status: 400 });
    const runId = String(args.run_id || `run-${crypto.randomUUID()}`);
    const task: AutonomyTask = {
      taskId: `task-${crypto.randomUUID()}`,
      runId,
      taskClass: String(args.task_class || 'idea-intake') as TaskClass,
      objective: idea,
      input: args,
      requestedProvider: args.provider ? String(args.provider) as ProviderId : undefined,
      allowFallback: true,
      maxConcurrency: Number(args.max_concurrency || 8),
      idempotencyKey: String(args.idempotency_key || `autonomy:${runId}:root`),
      metadata: { source: 'mcp', canonical_endpoint: 'https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp' },
    };
    return jsonRpc(body.id, await enqueueAutonomyTask(task, name === 'run_swarm' ? 'run-swarm' : 'autonomous-build', 1));
  }

  return NextResponse.json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: `Unknown tool ${name}` } }, { status: 404 });
}

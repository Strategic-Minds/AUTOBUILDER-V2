import type { AutonomyTask, FactoryJobRow, ProviderExecutionResult } from './types';

interface SupabaseResult<T> { ok: boolean; status: number; data: T | null; error: string | null; }

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('Supabase autonomy store is not configured');
  return { url, key };
}

async function sbOp<T>(path: string, method = 'GET', body?: unknown): Promise<SupabaseResult<T>> {
  try {
    const { url, key } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await response.text();
    let data: T | null = null;
    if (text) { try { data = JSON.parse(text) as T; } catch { data = text as unknown as T; } }
    return { ok: response.ok, status: response.status, data, error: response.ok ? null : text.slice(0, 800) };
  } catch (error) { return { ok: false, status: 0, data: null, error: error instanceof Error ? error.message : String(error) }; }
}

export async function enqueueAutonomyTask(task: AutonomyTask, jobType = 'autonomy-task', priority = 5) {
  const result = await sbOp<FactoryJobRow[]>('factory_jobs', 'POST', { job_type: jobType, queue_name: 'autonomy', title: task.objective.slice(0, 180), status: 'queued', idempotency_key: task.idempotencyKey, priority, input_payload: task });
  if (!result.ok) {
    if (result.status === 409) return { ok: true, duplicate: true, job: await getJobByIdempotencyKey(task.idempotencyKey) };
    throw new Error(`Failed to enqueue autonomy task: ${result.error ?? result.status}`);
  }
  return { ok: true, duplicate: false, job: Array.isArray(result.data) ? result.data[0] : null };
}

export async function getJobByIdempotencyKey(idempotencyKey: string) {
  const result = await sbOp<FactoryJobRow[]>(`factory_jobs?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`);
  if (!result.ok) throw new Error(`Failed to read autonomy job: ${result.error ?? result.status}`);
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function getJobById(id: string) {
  const result = await sbOp<FactoryJobRow[]>(`factory_jobs?id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!result.ok) throw new Error(`Failed to read autonomy job: ${result.error ?? result.status}`);
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function listAutonomyJobs(limit = 50) {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const result = await sbOp<FactoryJobRow[]>(`factory_jobs?queue_name=eq.autonomy&order=created_at.desc&limit=${safeLimit}`);
  if (!result.ok) throw new Error(`Failed to list autonomy jobs: ${result.error ?? result.status}`);
  return Array.isArray(result.data) ? result.data : [];
}

async function dependenciesSatisfied(job: FactoryJobRow): Promise<boolean> {
  const payload = job.input_payload ?? {};
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata as Record<string, unknown> : {};
  const dependencies = Array.isArray(metadata.dependencies) ? metadata.dependencies.filter((value): value is string => typeof value === 'string') : [];
  for (const dependency of dependencies) {
    const dependencyJob = await getJobByIdempotencyKey(dependency);
    if (!dependencyJob || dependencyJob.status !== 'completed') return false;
  }
  return true;
}

export async function claimNextAutonomyJob(workerId: string, leaseSeconds = 240) {
  const buildTypes = 'autonomous-build-root,autonomous-build-start,autonomous-build-monitor,autonomous-build-finalize,bulk-ingest';
  const queued = await sbOp<FactoryJobRow[]>(`factory_jobs?queue_name=eq.autonomy&status=eq.queued&job_type=not.in.(${buildTypes})&order=priority.asc,created_at.asc&limit=5`);
  if (!queued.ok) throw new Error(`Failed to inspect autonomy queue: ${queued.error ?? queued.status}`);
  for (const candidate of Array.isArray(queued.data) ? queued.data : []) {
    if (!(await dependenciesSatisfied(candidate))) continue;
    const claimed = await sbOp<FactoryJobRow[]>(`factory_jobs?id=eq.${encodeURIComponent(candidate.id)}&status=eq.queued`, 'PATCH', { status: 'leased', lease_owner: workerId, lease_expires_at: new Date(Date.now() + leaseSeconds * 1000).toISOString() });
    if (claimed.ok && Array.isArray(claimed.data) && claimed.data.length > 0) return claimed.data[0];
  }
  return null;
}

export async function completeAutonomyJob(job: FactoryJobRow, result: ProviderExecutionResult) {
  const patch = await sbOp<FactoryJobRow[]>(`factory_jobs?id=eq.${encodeURIComponent(job.id)}`, 'PATCH', { status: 'completed', lease_owner: null, lease_expires_at: null, last_error: null, completed_at: new Date().toISOString() });
  await writeAutonomyReceipt({ receiptType: 'autonomy-job', status: result.ok ? 'success' : 'failure', producedBy: `autonomy-router:${result.provider}`, summary: `${job.title} completed by ${result.provider}`, evidence: { job_id: job.job_id ?? job.id, provider: result.provider, external_id: result.externalId, output: result.output, attempts: result.attempts }, rollbackAvailable: true });
  if (!patch.ok) throw new Error(`Provider succeeded but job completion write failed: ${patch.error ?? patch.status}`);
  return Array.isArray(patch.data) ? patch.data[0] ?? null : null;
}

export async function failAutonomyJob(job: FactoryJobRow, error: string, requeue = false) {
  const patch = await sbOp<FactoryJobRow[]>(`factory_jobs?id=eq.${encodeURIComponent(job.id)}`, 'PATCH', { status: requeue ? 'queued' : 'failed', lease_owner: null, lease_expires_at: null, last_error: error.slice(0, 1000) });
  await writeAutonomyReceipt({ receiptType: 'autonomy-job', status: 'failure', producedBy: 'autonomy-router', summary: `${job.title} failed`, evidence: { job_id: job.job_id ?? job.id, error: error.slice(0, 1000), requeue }, rollbackAvailable: false });
  if (!patch.ok) throw new Error(`Failed to record autonomy job failure: ${patch.error ?? patch.status}`);
  return Array.isArray(patch.data) ? patch.data[0] ?? null : null;
}

export async function updateAutonomyJobStatus(id: string, status: 'queued' | 'cancelled' | 'failed') {
  const result = await sbOp<FactoryJobRow[]>(`factory_jobs?id=eq.${encodeURIComponent(id)}`, 'PATCH', { status, lease_owner: null, lease_expires_at: null, completed_at: status === 'queued' ? null : new Date().toISOString() });
  if (!result.ok) throw new Error(`Failed to update autonomy job: ${result.error ?? result.status}`);
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function writeAutonomyReceipt(input: { receiptType: string; status: 'success' | 'failure' | 'planned'; producedBy: string; summary: string; evidence: Record<string, unknown>; rollbackAvailable: boolean; }) {
  const result = await sbOp<Array<{ receipt_id?: string; id?: string }>>('factory_receipts', 'POST', { receipt_type: input.receiptType, status: input.status, produced_by: input.producedBy, action_summary: input.summary, evidence: input.evidence, rollback_available: input.rollbackAvailable });
  return { ok: result.ok, receiptId: Array.isArray(result.data) ? result.data[0]?.receipt_id ?? result.data[0]?.id ?? null : null, error: result.error };
}

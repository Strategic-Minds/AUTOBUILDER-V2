import { canonicalHash } from './idempotency';
import { PipelineError } from './errors';

export type LeaseStatus = 'idle' | 'leased' | 'expired';

export interface Lease {
  stepKey: string;
  owner: string;
  expiresAt: Date;
  attempt: number;
}

export class DurableOrchestrator {
  private maxRetries = 3;
  private leaseSeconds = 300;

  async claimStep(db: any, runId: string, stepKey: string, workerId: string): Promise<Lease | null> {
    const now = new Date();
    const expires = new Date(now.getTime() + this.leaseSeconds * 1000);
    try {
      const step = await db.pipeline_steps.findFirst({
        where: { run_id: runId, step_key: stepKey, status: { in: ['ready', 'failed'] }, attempt: { lt: this.maxRetries } }
      });
      if (!step) return null;
      await db.pipeline_steps.update({
        where: { id: step.id },
        data: { status: 'leased', lease_owner: workerId, lease_expires_at: expires, attempt: step.attempt + 1 }
      });
      return { stepKey, owner: workerId, expiresAt: expires, attempt: step.attempt + 1 };
    } catch (e) { return null; }
  }

  async completeStep(db: any, runId: string, stepKey: string, output: unknown): Promise<void> {
    const outputHash = canonicalHash(output);
    await db.pipeline_steps.updateMany({
      where: { run_id: runId, step_key: stepKey },
      data: { status: 'succeeded', output_hash: outputHash, lease_owner: null, lease_expires_at: null }
    });
  }

  async failStep(db: any, runId: string, stepKey: string, error: PipelineError): Promise<void> {
    await db.pipeline_steps.updateMany({
      where: { run_id: runId, step_key: stepKey },
      data: { status: error.retryable ? 'failed' : 'blocked', error_code: error.code }
    });
  }
}
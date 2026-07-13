export type ProviderId =
  | 'openai-multi-agent'
  | 'base44'
  | 'codex'
  | 'github'
  | 'vercel'
  | 'mcp'
  | 'n8n'
  | 'browser-worker'
  | 'google-drive'
  | 'local-queue';

export type TaskClass =
  | 'idea-intake'
  | 'planning'
  | 'research'
  | 'coding'
  | 'ui-build'
  | 'backend-build'
  | 'review'
  | 'testing'
  | 'repair'
  | 'github'
  | 'vercel'
  | 'workflow'
  | 'browser'
  | 'drive'
  | 'synthesis'
  | 'notification';

export interface AutonomyTask {
  taskId: string;
  runId: string;
  projectId?: string;
  taskClass: TaskClass;
  objective: string;
  input?: Record<string, unknown>;
  requestedProvider?: ProviderId;
  allowFallback?: boolean;
  maxConcurrency?: number;
  timeoutMs?: number;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderAttempt {
  provider: ProviderId;
  configured: boolean;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  ok: boolean;
  status: number;
  error?: string;
}

export interface ProviderExecutionResult {
  ok: boolean;
  provider: ProviderId;
  status: number;
  output?: unknown;
  externalId?: string;
  receipt?: Record<string, unknown>;
  error?: string;
  attempts?: ProviderAttempt[];
}

export interface RouteDecision {
  taskClass: TaskClass;
  providers: ProviderId[];
  reason: string;
}

export interface ConnectionStatus {
  id: string;
  label: string;
  configured: boolean;
  required: boolean;
  capabilities: string[];
  missingEnvironmentVariables: string[];
  mode: 'direct' | 'mcp' | 'webhook' | 'queue' | 'observability';
}

export interface FactoryJobRow {
  id: string;
  job_id?: string;
  job_type: string;
  queue_name: string;
  title: string;
  status: string;
  priority?: number;
  attempt_count?: number;
  max_attempts?: number;
  lease_owner?: string | null;
  lease_expires_at?: string | null;
  input_payload?: Record<string, unknown> | null;
  last_error?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

export interface McpRequest {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const AUTONOMY_STAGES = [
  'INTAKE',
  'INGESTION',
  'PLANNING',
  'SWARM',
  'BUILD',
  'BROWSER_VALIDATION',
  'PROVISIONING',
  'VALIDATION',
  'FINALIZATION',
  'COMPLETE',
] as const;

export type AutonomyStage = (typeof AUTONOMY_STAGES)[number];
export type AutonomyStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'NEEDS_INPUT' | 'FAILED' | 'CANCELLED' | 'COMPLETE';

export interface AutonomousBuild {
  id: string;
  idempotency_key: string;
  title: string;
  mission: string;
  requested_outputs: string[];
  source_manifest: Record<string, unknown>;
  browser_mode: 'auto' | 'headless' | 'headful';
  max_concurrency: number;
  priority: number;
  status: AutonomyStatus;
  current_stage: AutonomyStage;
  progress: number;
  upstream_run_id: string | null;
  upstream_status: Record<string, unknown>;
  github_repo_url: string | null;
  github_branch: string | null;
  github_pr_url: string | null;
  vercel_project_id: string | null;
  vercel_project_url: string | null;
  preview_url: string | null;
  validation_score: number | null;
  artifact_manifest: unknown[];
  retry_count: number;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type FactoryJob = FactoryJobRow;

export interface SubmitAutonomousBuildInput {
  title: string;
  mission: string;
  requestedOutputs?: string[];
  sourceManifest?: Record<string, unknown>;
  priority?: number;
  browserMode?: 'headless' | 'headful' | 'auto';
  maxConcurrency?: number;
}

export interface UpstreamSwarmStatus {
  status?: string;
  progress?: number;
  github_repo_url?: string;
  github_branch?: string;
  github_pr_url?: string;
  vercel_project_id?: string;
  vercel_project_url?: string;
  preview_url?: string;
  validation_score?: number;
  artifacts?: unknown[];
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

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

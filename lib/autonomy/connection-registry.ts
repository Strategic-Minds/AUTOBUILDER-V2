import type { ConnectionStatus, ProviderId } from './types';

interface ConnectionDefinition {
  id: string;
  label: string;
  required: boolean;
  mode: ConnectionStatus['mode'];
  capabilities: string[];
  anyOf?: string[][];
  allOf?: string[];
}

const CONNECTIONS: ConnectionDefinition[] = [
  { id: 'supabase', label: 'Supabase durable queue and receipts', required: true, mode: 'queue', allOf: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], capabilities: ['idea queue', 'job leases', 'receipts', 'recovery', 'completed-project ledger'] },
  { id: 'openai', label: 'OpenAI multi-agent runtime', required: true, mode: 'direct', anyOf: [['OPENAI_API_KEY'], ['AI_GATEWAY_API_KEY']], capabilities: ['recursive subagents', 'planning', 'review', 'synthesis'] },
  { id: 'ai-gateway', label: 'Vercel AI Gateway or OpenAI-compatible model gateway', required: false, mode: 'direct', anyOf: [['AI_GATEWAY_API_KEY', 'AI_GATEWAY_BASE_URL']], capabilities: ['provider routing', 'model fallback', 'usage telemetry'] },
  { id: 'base44', label: 'Base44 autonomous builder agent', required: true, mode: 'direct', allOf: ['BASE44_API_KEY'], capabilities: ['app editing', 'UI implementation', 'dashboard implementation'] },
  { id: 'codex', label: 'Codex execution adapter', required: true, mode: 'webhook', anyOf: [['CODEX_EXECUTION_ENDPOINT', 'CODEX_EXECUTION_TOKEN'], ['CODEX_MCP_URL', 'CODEX_MCP_TOKEN'], ['GITHUB_TOKEN', 'CODEX_GITHUB_REPOSITORY']], capabilities: ['repository implementation', 'tests', 'repairs', 'pull requests'] },
  { id: 'github', label: 'GitHub repository control', required: true, mode: 'mcp', anyOf: [['GITHUB_MCP_URL', 'GITHUB_MCP_TOKEN'], ['GITHUB_TOKEN'], ['GITHUB_APP_ID', 'GITHUB_APP_PRIVATE_KEY', 'GITHUB_INSTALLATION_ID']], capabilities: ['inventory sync', 'create repository', 'create branch', 'commit', 'pull request'] },
  { id: 'vercel', label: 'Vercel project and deployment control', required: true, mode: 'mcp', anyOf: [['VERCEL_MCP_URL', 'VERCEL_MCP_TOKEN'], ['VERCEL_TOKEN', 'VERCEL_TEAM_ID']], capabilities: ['inventory sync', 'create project', 'link repository', 'preview deployment', 'deployment status'] },
  { id: 'autobuilder-mcp', label: 'AUTO BUILDER MCP mesh', required: true, mode: 'mcp', anyOf: [['UPSTREAM_MCP_URL', 'UPSTREAM_MCP_TOKEN'], ['GITHUB_MCP_URL', 'VERCEL_MCP_URL']], capabilities: ['tool discovery', 'tool execution', 'platform provisioning', 'rollback'] },
  { id: 'n8n', label: 'n8n workflow fallback', required: false, mode: 'webhook', allOf: ['N8N_WEBHOOK_URL'], capabilities: ['workflow fan-out', 'notifications', 'external integration fallback'] },
  { id: 'browser-worker', label: 'Browser Worker and Playwright execution', required: false, mode: 'webhook', allOf: ['BROWSER_WORKER_URL'], capabilities: ['browser validation', 'screenshots', 'computer use', 'site inspection'] },
  { id: 'google-drive', label: 'Google Drive and Workspace MCP', required: false, mode: 'mcp', anyOf: [['GOOGLE_DRIVE_MCP_URL', 'GOOGLE_DRIVE_MCP_TOKEN']], capabilities: ['artifact storage', 'workbook retrieval', 'handoff synchronization'] },
  { id: 'notifications', label: 'Operator notification channel', required: false, mode: 'webhook', anyOf: [['SLACK_WEBHOOK_URL'], ['GOOGLE_CHAT_WEBHOOK_URL'], ['RESEND_API_KEY']], capabilities: ['completion alert', 'failure alert', 'approval request'] },
  { id: 'observability', label: 'OpenTelemetry or Sentry', required: false, mode: 'observability', anyOf: [['OTEL_EXPORTER_OTLP_ENDPOINT'], ['SENTRY_DSN']], capabilities: ['traces', 'latency', 'errors', 'provider fallback telemetry'] },
];

function envPresent(name: string): boolean {
  return typeof process.env[name] === 'string' && process.env[name]!.trim().length > 0;
}

function evaluate(def: ConnectionDefinition): ConnectionStatus {
  const allMissing = (def.allOf ?? []).filter((key) => !envPresent(key));
  const optionGroups = def.anyOf ?? [];
  const anySatisfied = optionGroups.length === 0 || optionGroups.some((group) => group.every(envPresent));
  const bestMissingGroup = optionGroups.map((group) => group.filter((key) => !envPresent(key))).sort((a, b) => a.length - b.length)[0] ?? [];
  return { id: def.id, label: def.label, configured: allMissing.length === 0 && anySatisfied, required: def.required, capabilities: def.capabilities, missingEnvironmentVariables: [...allMissing, ...(anySatisfied ? [] : bestMissingGroup)], mode: def.mode };
}

export function getConnectionStatuses(): ConnectionStatus[] {
  return CONNECTIONS.map(evaluate);
}

export function getMissingRequiredConnections(): ConnectionStatus[] {
  return getConnectionStatuses().filter((connection) => connection.required && !connection.configured);
}

export function isProviderConfigured(provider: ProviderId): boolean {
  const mapping: Partial<Record<ProviderId, string>> = { 'openai-multi-agent': 'openai', base44: 'base44', codex: 'codex', github: 'github', vercel: 'vercel', mcp: 'autobuilder-mcp', n8n: 'n8n', 'browser-worker': 'browser-worker', 'google-drive': 'google-drive', 'local-queue': 'supabase' };
  const id = mapping[provider];
  return id ? getConnectionStatuses().some((connection) => connection.id === id && connection.configured) : false;
}

export function redactedConnectionSummary() {
  const connections = getConnectionStatuses();
  return {
    ready: connections.filter((item) => item.required).every((item) => item.configured),
    configured: connections.filter((item) => item.configured).map((item) => item.id),
    missingRequired: connections.filter((item) => item.required && !item.configured).map((item) => ({ id: item.id, missingEnvironmentVariables: item.missingEnvironmentVariables })),
    connections,
  };
}

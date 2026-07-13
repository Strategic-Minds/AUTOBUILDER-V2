// Xtreme Builder — Persistent Multi-Agent 24/7 swarm model.
// Derived from STRATEGIC_MINDS_XTREME_BUILDER_PERSISTENT_MULTI_AGENT_24_7_CEILING_PLAN.xlsx
// Sheets: 06_PERSISTENT_CHAT, 08_AGENT_SWARM, 09_AGENT_CONTRACTS, 14_WORKFLOW_24_7.

export type AgentType =
  | "orchestrator"
  | "validator"
  | "worker"
  | "repairer"
  | "hardener"
  | "notifier";

export type AgentStatus = "online" | "busy" | "idle" | "stalled";

export interface SwarmAgent {
  id: string;
  name: string;
  short: string;
  type: AgentType;
  mission: string;
  allowed: string;
  forbidden: string;
  /** Capability keywords used by the orchestrator to route work. */
  capabilities: string[];
}

// 08_AGENT_SWARM — narrow specialists under one master orchestrator.
export const SWARM: SwarmAgent[] = [
  { id: "AG-001", name: "Master Orchestrator", short: "Orchestrator", type: "orchestrator", mission: "Compile intent, dependency graph, route work, maintain workflow", allowed: "Read all governed state; write jobs/drafts", forbidden: "Approvals, production, secrets", capabilities: ["plan", "route", "orchestrate", "compile", "intent"] },
  { id: "AG-002", name: "Source Truth Auditor", short: "Truth Auditor", type: "validator", mission: "Resolve sources, freshness, conflicts, hashes, authority", allowed: "Read connectors and artifacts", forbidden: "Mutating sources", capabilities: ["source", "truth", "verify", "conflict", "audit", "fact"] },
  { id: "AG-003", name: "Continuity Compiler", short: "Continuity", type: "worker", mission: "Create checkpoints, handoffs, daily compile, resume packages", allowed: "Write continuity records", forbidden: "Storing secrets", capabilities: ["checkpoint", "handoff", "resume", "continuity", "compile"] },
  { id: "AG-004", name: "MCP Architect", short: "MCP Architect", type: "worker", mission: "Design tools, schemas, auth, scopes, versioning", allowed: "Draft specs and tests", forbidden: "Live secret/config changes", capabilities: ["mcp", "tool", "schema", "scope", "protocol", "api"] },
  { id: "AG-005", name: "Identity and Access Engineer", short: "Identity/Access", type: "worker", mission: "OAuth clients, RBAC/ABAC, least privilege, service identities", allowed: "Draft policies", forbidden: "Granting permissions", capabilities: ["identity", "access", "oauth", "rbac", "permission", "auth"] },
  { id: "AG-006", name: "Workflow Engineer", short: "Workflow Eng", type: "worker", mission: "Durable workflows, waits, retries, compensation, heartbeat", allowed: "Branch/draft code", forbidden: "Production schedule activation", capabilities: ["workflow", "durable", "retry", "heartbeat", "queue", "resume"] },
  { id: "AG-007", name: "Data Architect", short: "Data Architect", type: "worker", mission: "Supabase schemas, migrations, RLS, indexes, retention", allowed: "Draft migrations", forbidden: "Production migration", capabilities: ["data", "schema", "migration", "rls", "supabase", "database", "index"] },
  { id: "AG-008", name: "Conversation Systems Engineer", short: "Conversation Eng", type: "worker", mission: "Persistent chat ledger, threading, replay, context packaging", allowed: "Branch/draft code", forbidden: "Changing production data", capabilities: ["chat", "ledger", "thread", "replay", "context", "message"] },
  { id: "AG-009", name: "Base44 Integration Engineer", short: "Base44", type: "worker", mission: "Control plane, registries, OpenAPI packs, operator UX", allowed: "Base44 draft/preview edits", forbidden: "Production app changes", capabilities: ["base44", "control", "registry", "openapi", "operator"] },
  { id: "AG-010", name: "ChatGPT Integration Engineer", short: "ChatGPT", type: "worker", mission: "Custom MCP app, tool semantics, confirmations, workspace handoff", allowed: "Draft connector config", forbidden: "Publishing without approval", capabilities: ["chatgpt", "connector", "confirmation", "workspace"] },
  { id: "AG-011", name: "Frontend Principal", short: "Frontend", type: "worker", mission: "Adaptive UI, design system, PWA, accessibility, data viz", allowed: "Branch/preview code", forbidden: "Production release", capabilities: ["frontend", "ui", "design", "pwa", "accessibility", "viz", "component"] },
  { id: "AG-012", name: "Backend Principal", short: "Backend", type: "worker", mission: "Typed APIs, concurrency, idempotency, queues, rate limits", allowed: "Branch code", forbidden: "Production mutation", capabilities: ["backend", "api", "concurrency", "idempotency", "queue", "ratelimit"] },
  { id: "AG-013", name: "Agent Evaluation Lead", short: "Eval Lead", type: "validator", mission: "Role evals, tool-use evals, safety/adversarial tests", allowed: "Write validation evidence", forbidden: "Fixing own failures", capabilities: ["eval", "test", "safety", "adversarial", "validate"] },
  { id: "AG-014", name: "Security Auditor", short: "Security", type: "validator", mission: "Threat model, auth, SSRF, injection, secrets, dependencies", allowed: "Read/test", forbidden: "Approving security exceptions", capabilities: ["security", "threat", "ssrf", "injection", "secret", "vuln"] },
  { id: "AG-015", name: "Privacy Auditor", short: "Privacy", type: "validator", mission: "Data minimization, retention, consent, sensitive data", allowed: "Read/test", forbidden: "Policy waiver", capabilities: ["privacy", "retention", "consent", "sensitive", "pii"] },
  { id: "AG-016", name: "Accessibility Validator", short: "A11y", type: "validator", mission: "WCAG journeys, keyboard, screen reader, reduced motion", allowed: "Test preview", forbidden: "UI writes", capabilities: ["accessibility", "wcag", "keyboard", "screenreader", "a11y"] },
  { id: "AG-017", name: "Performance Engineer", short: "Performance", type: "validator", mission: "Budgets, load, latency, cache, Core Web Vitals", allowed: "Test preview", forbidden: "Production scale changes", capabilities: ["performance", "load", "latency", "cache", "vitals", "speed"] },
  { id: "AG-018", name: "Cost Governor", short: "Cost Governor", type: "hardener", mission: "Budgets, quotas, model routing, forecast spend, kill switches", allowed: "Pause over-budget jobs", forbidden: "Increasing budgets", capabilities: ["cost", "budget", "quota", "spend", "kill"] },
  { id: "AG-019", name: "Financial Intelligence Architect", short: "Financial Intel", type: "worker", mission: "Point-in-time data, forecasts, uncertainty, model risk", allowed: "Draft models", forbidden: "Trading or guarantees", capabilities: ["financial", "forecast", "uncertainty", "model", "revenue"] },
  { id: "AG-020", name: "Scraper Policy Engineer", short: "Scraper", type: "worker", mission: "Policy-aware ingestion, robots, limits, provenance", allowed: "Sandbox fetches", forbidden: "CAPTCHA/paywall/auth bypass", capabilities: ["scraper", "ingest", "robots", "provenance", "fetch"] },
  { id: "AG-021", name: "Repair Agent", short: "Repair", type: "repairer", mission: "Root cause, minimal patch, sandbox retest, rollback packet", allowed: "Branch/sandbox writes", forbidden: "Infinite retries or self-approval", capabilities: ["repair", "fix", "rootcause", "patch", "rollback", "bug"] },
  { id: "AG-022", name: "Release Manager", short: "Release", type: "validator", mission: "Gate evidence, rollback proof, release decision packet", allowed: "Read evidence; prepare approval", forbidden: "Deploying without approval", capabilities: ["release", "gate", "deploy", "rollback"] },
  { id: "AG-023", name: "Incident Commander", short: "Incident Cmd", type: "notifier", mission: "Coordinate incidents, isolate failures, recovery, postmortem", allowed: "Pause jobs/kill switch", forbidden: "Destructive recovery without approval", capabilities: ["incident", "isolate", "recovery", "postmortem", "outage"] },
  { id: "AG-024", name: "Receipt Compiler", short: "Receipts", type: "worker", mission: "Normalize action, validation, approval, failure, rollback receipts", allowed: "Append receipts", forbidden: "Editing past receipts", capabilities: ["receipt", "normalize", "evidence", "record"] },
];

export const AGENT_BY_ID = Object.fromEntries(SWARM.map((a) => [a.id, a]));

// Risk classes gate what work may run without operator approval (10_IDENTITY_SCOPES / 19_APPROVAL_MATRIX).
export type RiskClass = "safe" | "review" | "protected";

export const RISK_META: Record<RiskClass, { label: string; description: string; requiresApproval: boolean }> = {
  safe: { label: "Safe", description: "Read / test / sandbox / draft work", requiresApproval: false },
  review: { label: "Review", description: "Branch, migration draft, preview deploy", requiresApproval: false },
  protected: { label: "Protected", description: "Production, secrets, merges, approvals", requiresApproval: true },
};

// 06_PERSISTENT_CHAT — message lifecycle stages.
export const LIFECYCLE = [
  { stage: 1, state: "Accepted", behavior: "Authenticate sender; validate content; assign request ID" },
  { stage: 2, state: "Persisted", behavior: "Write immutable message and outbox event in one transaction" },
  { stage: 3, state: "Classified", behavior: "Determine intent, risk, project, thread, required capabilities" },
  { stage: 4, state: "Routed", behavior: "Create/resume workflow; deliver to selected agent consumers" },
  { stage: 5, state: "Acknowledged", behavior: "Record delivery acknowledgement and agent lease" },
  { stage: 6, state: "Worked", behavior: "Agent emits progress events, artifacts, tool calls, evidence" },
  { stage: 7, state: "Validated", behavior: "Independent validator attaches result and score" },
  { stage: 8, state: "Resolved", behavior: "Post final message, receipt, checkpoint, next action" },
  { stage: 9, state: "Recovered", behavior: "Heartbeat resumes stalled messages from checkpoint or DLQ" },
] as const;

export type LifecycleState = (typeof LIFECYCLE)[number]["state"];

export const AGENT_TYPE_META: Record<AgentType, { label: string; tone: string }> = {
  orchestrator: { label: "Orchestrator", tone: "electric" },
  validator: { label: "Validator", tone: "violet" },
  worker: { label: "Worker", tone: "blue" },
  repairer: { label: "Repairer", tone: "amber" },
  hardener: { label: "Hardener", tone: "red" },
  notifier: { label: "Notifier", tone: "green" },
};

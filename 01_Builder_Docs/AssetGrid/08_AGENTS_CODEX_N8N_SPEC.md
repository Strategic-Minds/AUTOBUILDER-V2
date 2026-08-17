# AssetGrid Vercel Agents / Codex / n8n Specification v1

Status: DRAFT / PREVIEW-ONLY
Owner: Base44 APEX Build Orchestrator

## Purpose
Define specialist execution boundaries and optional workflow integration without allowing agents to self-approve or bypass governance.

## Agent roles
- Source Truth Scout: public intelligence, current-state map, rights boundary.
- Visual Parity Agent: independent visual/responsive contract validation.
- Backend Data Agent: domain/API/data contracts.
- Commerce & License Agent: test-double commerce, entitlements, licenses.
- Search & Recommendation Agent: retrieval/facets/ranking/recommendations.
- Asset Pipeline Agent: upload/file safety/preview/delivery.
- Author Compliance Agent: author status/ledger/compliance requirements.
- QA Recursive Repair Agent: deterministic validation and repair routing.
- Security Hardening Agent: threat model/security/hardening.
- Reliability & Observability Agent: queues/recovery/health/backup.
- Accessibility & Performance Agent: WCAG/performance.
- Receipt Auditor: traceability/completion gate.

## Packet contract
Every agent packet includes immutable requirement ID, project ID, source truth, owned files/surfaces, allowed tools, forbidden actions, risk class, acceptance criteria, tests, budget, expected evidence, rollback, and receipt destination.

## Separation rules
Coder cannot finally validate itself. Validator cannot silently repair candidate and approve it. Repairer cannot approve release. Protected actions require operator approval.

## Vercel Agent/Workflow use
Use durable workflows for long-running orchestration where available. Cron heartbeat materializes/claims work; workflows execute bounded packets; runtime records telemetry and receipts. Preview-safe tasks only under overnight authorization.

## Codex packets
Use Codex/engineering agents for isolated code packets with explicit branch, file ownership, tests, and no main/prod writes. One capability per packet/commit where practical.

## n8n
n8n is optional, not a source of truth. Use only if a required external workflow is better served by n8n and it can preserve idempotency, receipts, secrets boundaries, and approval gates. Do not duplicate Vercel Workflow queue orchestration in n8n.

## Failure behavior
Agent failure -> receipt -> smallest repair/requeue. Repeated deterministic failures -> dead-letter/failure pattern. Never spin unlimited retries.

## Validation
Role permissions, file ownership conflicts, duplicate-claim prevention, validator separation, budget limits, tool allowlists, prompt-injection resistance, audit receipts.

## Gates
No production merge/deploy, secrets, spend, customer messaging, or destructive actions.

## Rollback
Cancel queued preview jobs; revert branch commits; preserve failure/validation receipts.
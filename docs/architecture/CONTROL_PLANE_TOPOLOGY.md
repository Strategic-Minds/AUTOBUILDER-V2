# Control Plane Topology - Real vs Target (as of 2026-07-02)

## The honest current picture

| Layer | Target (spec) | Real today |
|---|---|---|
| Registries (SystemRegistry, ProjectRegistry, QueueRegistry, JobRegistry, ApprovalQueue, ArtifactRegistry, ValidationRegistry, ScoringRegistry, RepairQueue, HardeningQueue, CronRegistry, DriftRegistry, NotificationRegistry, AgentRegistry, WorkflowRegistry) | Independent data layer, readable/writable by any service | Live as Base44 Superagent entities. Only the orchestrating agent (this Superagent) can read/write them - the deployed Next.js app has no Base44 API credentials and cannot reach them today. |
| Services (queue-engine, approval-engine, validation-engine, scoring-engine, repair-engine, hardening-engine, notification-engine, registry-engine) | Independently deployable backend services | Not built. The equivalent logic runs *inside the agent's own reasoning* during cron-triggered runs (see CronRegistry). `services/*/README.md` marks the extraction target, not working code. |
| Workers (heartbeat, sandbox-builder, test-runner, repair-worker, hardening-worker, drift-checker) | Standalone execution units | `sandbox-builder.ts` and `test-runner.ts` are real. `heartbeat-worker` and `drift-checker` are Base44 automations today, not repo code. The 12 factory adapters (workers/adapters/*) ARE real, tested, standalone-runnable units against live Supabase. |
| Apps (marketing-site, client-portal, admin-dashboard) | 3 separate deployable frontends | Only one app exists: a single dashboard page + all API routes (effectively "admin-dashboard" + backend). No marketing-site or client-portal exists. **Per the frontend-boundary rule in the governing prompt, building those is explicitly out of scope for this agent** - flagging this as a contradiction between the repo-shape spec (section 8) and the frontend-boundary rule (section 12), not resolving it unilaterally. |

## Why this split exists (not an oversight)
The Base44 Superagent already provides a governed, auditable, approval-gated orchestration
layer (memory, entities, automations, receipts) "for free" - rebuilding that as independent
Vercel services would duplicate governance logic that already works and is tested. The
pragmatic real architecture is:

**Base44 Superagent (control plane, live)** --cron/on-demand--> **this repo's workers/adapters (execution, live)** --REST--> **Supabase (data, live)**

The target spec's services/* layer becomes relevant only if/when this needs to run
without the agent in the loop (e.g. a fully autonomous, agent-less pipeline). That is a
real, large future decision - not something to fake as already done.

## What IS real and verified (2026-07-02)
- 15 registries live in Base44, seeded with real (not fabricated) data
- 4 cron automations live (heartbeat, sync, twice-daily test/score/drift, nightly drain)
- 12 factory adapters, real code, tested against live Supabase, tsc clean, build clean, 5/5 unit tests, 2/2 e2e
- 1 real client project tracked (Phoenix Epoxy Pros) - currently archived/out-of-focus per Jeremy's directive

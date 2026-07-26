# Live Connector Census

Date: 2026-07-25
Branch: `auto-builder/forensic-consolidation-20260725`
Mission: one-shot Strategic Minds super-platform consolidation
Production status: `LOCKED`

## Evidence priority

This census uses current connector and runtime evidence ahead of older summaries.

## Google Drive

- Two shared drives were visible: `System of Record v1` and `STRATEGIC MINDS`.
- The current `XAB Canonical System Flow and GPT Handoff` document, created 2026-07-23, identifies:
  - primary repository: `Strategic-Minds/AUTOBUILDER-V2`
  - supporting repository: `Strategic-Minds/XAB`
  - Base44 orchestrator app: `6a4ae522852a5e08bfa42450`
  - Supabase project: `azajysheebfhyzoyplpf`
  - primary project table: `xai_projects`
  - expected runtime: `xab-system.vercel.app`
- The document also records incomplete route, schema, control, and production-readiness validation.

## GitHub

- The standard organization listing exposed at least 71 Strategic-Minds repositories.
- Additional installed repositories were discoverable through installed-repository search, so the first list endpoint is not a complete census by itself.
- `Strategic-Minds/AUTO_BUILDER` resolves to `Strategic-Minds/AUTO_BUILDER-V1`; no separate exact repository was verified.
- Canonical branch-safe consolidation already existed as draft PR #31:
  - repository: `Strategic-Minds/AUTOBUILDER-V2`
  - branch: `auto-builder/forensic-consolidation-20260725`
  - production lock: enabled
- Current donor authority map:
  - canonical runtime: `AUTOBUILDER-V2`
  - validation, observability, PWA: `XAB`
  - GPT bridge, MCP, workflow governance: `AUTO_BUILDER-V1`
  - advanced adapters: `v0-auto-builder-v2`
  - UI: `auto-builder-os`
  - browser validation: external `BROWSERWORKER`

## Vercel

Team: `team_aFdds8lsbHMwe2ip4aQdbQ3d`

### `auto-builder`

- Project ID: `prj_qaUnGOL4MmPvm11Hqxp9Cn0YDfmv`
- Git source: `Strategic-Minds/AUTO_BUILDER-V1`
- Repeated production deployments are failing.
- Current verified build failure: missing `@/lib/internal-auth` in multiple API routes.
- Repeated bridge smoke-test commits are triggering failed production builds and are not evidence of a working end-to-end pipeline.

### `autobuilder-v2`

- Project ID: `prj_YSIPjYnM4KtbsiQsVVLHQ5A3AVWe`
- Git source: `Strategic-Minds/AUTOBUILDER-V2`
- Draft PR #31 automatically generates preview deployments.
- Initial PR #31 preview failed because AI SDK core and React packages belonged to different API generations.
- A branch-only repair wave was committed to align the AI SDK packages and migrate chat components to the transport API.

### `xab-system`

- Project ID: `prj_1jmQQXTLAMNCsJzTSzTsDnsg0hWX`
- Git source: `Strategic-Minds/AUTOBUILDER-V2`
- A current `READY` deployment was observed.
- Current aliases include `xab-system.vercel.app`, `autobuilderos.com`, and `www.autobuilderos.com`.
- This is the strongest observed runtime deployment, but it does not prove the full autonomous golden path.

## Base44

- Authenticated account exposed 29 apps.
- The canonical orchestrator candidate is `Xtreme AI Builder`, app ID `6a4ae522852a5e08bfa42450`.
- It exposes 30 governed entity schemas, including system, project, workflow, job, approval, artifact, validation, receipt, operator decision, connector, intelligence, queue, memory, execution, and agent records.
- Registry records contain historical authority drift and cannot override current GitHub, Vercel, and database evidence without reconciliation.
- Some workflows are active, but the universal autonomous pipeline is not proven by a complete receipt chain.

## Supabase

- Organization: `JEREMYS`
- Project: `xpsint`
- Project ref: `azajysheebfhyzoyplpf`
- Project runtime reports `ACTIVE_HEALTHY`.
- The branch/migration surface reports `MIGRATIONS_FAILED`.
- The public schema contains broad control-plane, project, agent, task, execution, approval, receipt, factory, session, and workflow tables.
- Security advisors report release-blocking RLS, privilege, function-execution, storage, and policy weaknesses.
- No production migration was applied during this census.

## Authority conclusion

The strongest evidence-backed authority model is:

1. `AUTOBUILDER-V2` as canonical source and consolidation destination.
2. `xab-system` as the healthiest current runtime evidence.
3. Base44 app `6a4ae522852a5e08bfa42450` as the orchestration registry and coordination surface.
4. Supabase project `azajysheebfhyzoyplpf` as the existing state platform, under security quarantine for release.
5. `BROWSERWORKER` as an independent validation service.
6. GitHub branches and draft pull requests as the only permitted implementation boundary.

## Current release state

`BLOCKED_SECURITY_AND_VALIDATION`

Production promotion remains prohibited until:

- the preview build passes,
- database security blockers are remediated in an approved development migration,
- the BrowserWorker adapter is proven,
- one complete golden-path project produces an evidence chain,
- rollback is rehearsed,
- the state reaches `AWAITING_PRODUCTION_APPROVAL`.

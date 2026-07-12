# workers/

Real, independently-runnable execution units (`tsx workers/<name>.ts` or `.tsx`).

## Real today
- `adapters/*.ts` - the 12 factory adapters (content-gen, seo, image-queue, payment-gate, whatsapp-sync, social, quality-scan, auto-fix, auto-heal, auto-harden, competitor-intel, template-intel). Each exports `run()`, used both by `app/api/adapters/*/route.ts` (HTTP-triggered) and directly via `scripts/run_all_adapters.ts` (CLI-triggered). Verified against the live Supabase schema 2026-07-02.
- `sandbox-builder.ts` - wraps `tsc --noEmit` + `next build`, exits non-zero on failure.
- `test-runner.ts` - wraps the unit test suite.

## Named in the target spec but NOT YET implemented as standalone repo workers
These are currently performed by the Base44 Superagent's own cron-orchestrated automations (see `SystemRegistry`/`CronRegistry`/`WorkflowRegistry` entities), not as code in this repo:
- `heartbeat-worker` - today: Base44 automation "Queue Heartbeat" (every 30 min)
- `drift-checker` - today: Base44 automations "AUTO BUILDER 2.0 Drift Check" (daily) + "Twice-Daily Test, Score & Drift Review"
- `repair-worker` - today: `adapters/auto-fix.ts` covers code-level repair; queue-level repair draining is agent-orchestrated (nightly automation), not repo code
- `hardening-worker` - today: `adapters/auto-harden.ts` covers the actual scan; queue-level hardening draining is agent-orchestrated

See `docs/architecture/CONTROL_PLANE_TOPOLOGY.md` for why: the registries live in Base44, not Supabase, so only the orchestrating agent (not the deployed Next.js app) can read/write them today.

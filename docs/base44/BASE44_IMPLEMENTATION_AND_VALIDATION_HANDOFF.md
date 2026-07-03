# Base44 Implementation and Validation Handoff

Prepared by: AUTO_BUILDER 2.0
Date: 2026-07-03
Mode: governed branch-safe implementation, validator-first, no protected production mutation

## Mission

Implement the AUTO_BUILDER end-to-end autonomous factory expansion in `Strategic-Minds/AUTOBUILDER-V2`, preserving V1 Supabase MCP behavior as the current runtime source truth until V2 parity is fully validated.

## Source Truth To Load First

1. `Strategic-Minds/AUTO_BUILDER-V1`
   - `src/app/api/mcp-supabase/route.ts`
   - `src/lib/autobuilder-v2/supabase-job-runner.ts`
2. `Strategic-Minds/AUTOBUILDER-V2`
   - `vercel.json`
   - `app/api/cron/auto-builder/route.ts`
   - `.env.example.md`
   - `package.json`
3. `Strategic-Minds/MASTER-TEMPLATE-SYSTEM`
   - `README.md`
   - `docs/DELIVERY_TIERS.md`

## Implement First

Create branch:

`auto-builder-2/end-to-end-autonomous-factory-20260703`

Add V2 cron route parity:

- `app/api/cron/enterprise-kernel/route.ts`
- `app/api/cron/quality-auto-heal/route.ts`
- `app/api/cron/intelligence-ingest/route.ts`

Route requirements:

- Reject unauthorized requests when `CRON_SECRET` is configured.
- Default to `dry_run`.
- Return `production_mutation: false`.
- Return checked registries, proposed actions, blockers, and receipt target.
- Do not write live Supabase data yet.

## Implement Second

Add builder docs and registries:

- `docs/builder/AUTO_BUILDER_END_TO_END_AUTONOMOUS_FACTORY_REPORT.md`
- `docs/registries/control-plane-registry.json`
- `docs/registries/queue-lifecycle.yaml`
- `docs/registries/template-system-registry.yaml`
- `docs/registries/vercel-cron-spec.yaml`
- `docs/registries/validation-scorecard.yaml`
- `docs/registries/prompt-library.yaml`
- `docs/registries/gpt-bridge-registry.yaml`

## Implement Third

Add Supabase migration plan, but do not apply live:

- registry tables
- queue lifecycle tables
- receipt registry
- intelligence sources/chunks with pgvector
- validation and scoring history
- repair and hardening queues
- RLS policies
- rehydrate/dehydrate RPC definitions

## Validate

Required validation before merge:

- `npm install` or package manager equivalent.
- `npm run lint` if configured.
- `npm run build` if dependencies and env allow.
- Route parity check: every `vercel.json` cron path has a route file.
- Unauthorized cron request returns 401 when `CRON_SECRET` exists.
- Dry-run authorized cron request returns `production_mutation: false`.
- Registry JSON parses.
- YAML files parse.
- No secret values committed.

Required validation before live enablement:

- Supabase RLS anon-deny test.
- Supabase service-role-only RPC execution test.
- Rehydrate/dehydrate dry-run test.
- Vercel cron request header/log receipt.
- Playwright route and screenshot receipt for UI surfaces.
- Scorecard minimum for current tier.

## Protected Blockers To Escalate

Ask Jeremy for explicit approval before:

- production deployment
- destructive database migration
- live Supabase write/execute beyond dry-run
- credential or secret creation/change
- DNS/domain changes
- payment execution
- live customer/social messaging
- governance policy weakening

## Validation Output Required From Base44

Return:

1. branch name
2. draft PR link
3. changed file list
4. build/lint/test results
5. cron route validation receipt
6. registry parse receipt
7. Supabase dry-run receipt
8. blockers
9. rollback path
10. next action

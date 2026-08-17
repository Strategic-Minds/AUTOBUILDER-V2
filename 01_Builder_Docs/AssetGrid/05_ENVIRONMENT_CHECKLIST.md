# AssetGrid Environment Checklist v1

Status: DRAFT / NO SECRET VALUES
Owner: Release-Rollback Agent

## Purpose
Identify environment references and access gates required for preview validation without exposing credentials.

## Required environment names
### Base platform
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `CRON_SECRET`
- Base44 outbound auth variable such as `BASE44_SERVICE_TOKEN` or approved equivalent
- `BASE44_AGENT_URL` / `BASE44_AGENT_WEBHOOK_URL` where required

### AI
- provider-specific API key references only when approved
- AI Gateway/provider routing variables
- per-provider/model budget limits

### File/asset pipeline
- approved storage bucket/project references
- malware scanner endpoint/reference
- media processing worker references
- signed-download signing configuration

### Commerce test mode
- payment-provider TEST credentials only after approved environment binding
- webhook TEST signing secret
- payout provider remains disabled in preview unless explicitly approved

### Browser/observability
- BrowserWorker URL/auth reference if used
- Sentry/telemetry project reference if approved
- deployment URL/project ID references

## Current verified access
- GitHub AUTOBUILDER-V2: accessible.
- Base44 AssetGrid and AUTO BUILDER ORCHESTRATOR: accessible.
- Vercel connected team: `Xtreme-AI-Systems`.
- Canonical AUTOBUILDER-V2 Vercel deployment evidence points to `strategic-minds-advisory`, which is not accessible through the connected Vercel session (403).
- AssetGrid Base44 connectors: 0 authenticated at last inventory.

## Environment gates
- Do not create/change secrets overnight.
- Do not bind production DB or production payment credentials.
- Do not reveal secret values in docs, receipts, logs, commits, or chat.
- Production cron activation/change requires protected approval and owning Vercel access.

## Validation
For each variable/reference: presence test without value disclosure, server/client exposure check, least-privilege check, failure-mode test, receipt.

## Rollback
Environment configuration is unchanged by this branch. Revert docs/branch only.
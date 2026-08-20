# Autonomous Backlog Engine V1 Discovery Receipt

Date: 2026-08-20

## Verified before implementation
- Current authority map identifies `Strategic-Minds/AUTOBUILDER-V2` as primary runtime and mandates branch/draft-PR-only work while Production is locked.
- Existing `/api/cron/auto-builder` already runs every five minutes.
- Existing factory jobs already use durable Supabase leases and idempotency.
- BrowserWorker is evidence-only and has no Production authority.
- Current migration convention requires forward, rollback, and security review before Production DB changes.
- Current Vercel connector could not resolve the older stored project identifier.
- Current Supabase connector denied project inspection, so the proposed migration was not executed.

## Design decision
Integrate the Backlog Engine into the existing cron as an independent heartbeat result. It uses a dedicated atomic hourly lease and service-role-only tables. If its schema is absent, it reports `BLOCKED_BACKLOG_MIGRATION_REQUIRED` without stopping existing factory dispatch.

## Economic decision
Optimize verified profitable backlog per customer, not contract face value, lead count, estimate count, or unverified pipeline value.

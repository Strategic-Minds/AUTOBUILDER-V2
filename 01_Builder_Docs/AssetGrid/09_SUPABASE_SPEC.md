# AssetGrid Supabase / Transactional Data Specification v1

Status: DRAFT / MIGRATIONS NOT APPLIED
Owner: AssetGrid Backend Data Agent

## Purpose
Define the transactional data plane needed for marketplace data, RLS, durable jobs, receipts, repair/hardening, and recovery while preserving Base44 as experience/business control plane.

## Authority split
- Base44: project/operator experience, registries, approvals, high-level orchestration state.
- Supabase/Postgres: concurrency-critical transactional jobs, leases, idempotency, entitlements, economic ledgers, immutable/auditable event data where appropriate.
- GitHub: canonical code/spec source.
- Vercel: runtime/cron/workflow host.

## Schema families
`assetgrid_users`, `assetgrid_author_profiles`, `assetgrid_assets`, `assetgrid_asset_versions`, `assetgrid_asset_files`, `assetgrid_categories`, `assetgrid_tags`, `assetgrid_orders`, `assetgrid_order_lines`, `assetgrid_subscriptions`, `assetgrid_entitlements`, `assetgrid_licenses`, `assetgrid_download_grants`, `assetgrid_reviews`, `assetgrid_comments`, `assetgrid_support_cases`, `assetgrid_upload_sessions`, `assetgrid_submissions`, `assetgrid_moderation_findings`, `assetgrid_earning_entries`, `assetgrid_payout_references`, `assetgrid_events`, `assetgrid_audit_events`, `assetgrid_jobs`, `assetgrid_receipts`, `assetgrid_repairs`, `assetgrid_hardening_findings`, `assetgrid_incidents`.

Names are provisional and must be reconciled against existing production schemas before any migration.

## Queue requirements
Atomic claim using Postgres transaction/RPC; lease owner/token/expiry; fencing; heartbeat; available_at; attempt/max_attempt; dead-letter; immutable idempotency key; result/error; receipt correlation.

## RLS requirements
Default deny private tables. Explicit public catalog read policy limited to published fields. Owner isolation for buyer workspaces/entitlements/downloads. Author isolation for seller operations. Admin actions use explicit role claims and server-side checks. Service role never reaches client.

## Migration contract
Every migration packet contains forward SQL, rollback SQL, preflight inventory, collision detection, affected tables/policies/functions, backup/restore plan, test fixtures, and approval reference.

## Acceptance
- anonymous cannot read private buyer/author/admin data
- cross-user and cross-author access denied
- published catalog fields readable only as designed
- atomic job claims prevent double execution
- idempotent order/webhook/job writes
- rollback applies cleanly in isolated validation database
- migration reapply is deterministic where intended

## Current gate
No AssetGrid production Supabase project/migration has been authorized in this overnight run. Existing AUTOBUILDER-V2 factory code expects Supabase environment references, but actual production schema changes remain protected.

## Validation receipts
AG-VAL-102 is mandatory. AG-VAL-105 and AG-VAL-106 cover security/recovery.

## Rollback
Forward and rollback SQL must be validated in an isolated database before any protected production migration.
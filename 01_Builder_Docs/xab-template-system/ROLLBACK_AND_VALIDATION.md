# Rollback and Validation Contract

## Current gate

This repair is branch-only and sandbox-only. The staged Supabase migration is unapplied. No production deployment, protected merge, secret mutation, DNS action, paid resource, external message, or destructive action is authorized.

## Code rollback

1. Close the repair pull request.
2. Delete or archive the repair branch only after receipts are preserved.
3. Revert individual commits if selective rollback is required.
4. Do not rewrite `main` history.

## Preview rollback

1. Retain the previous READY deployment ID.
2. Remove or retire the generated preview deployment.
3. Close the generated draft pull request.
4. Preserve BrowserWorker screenshots, logs, and failure receipts.

## Database rollback

The migration `20260728090000_xab_approval_manifest_and_template_registry.sql` must first be tested in an isolated Supabase branch.

If rollback is required in that isolated branch:

```sql
begin;
drop trigger if exists xab_v3_approval_manifest_immutable_update on public.xab_v3_approval_manifests;
drop function if exists public.xab_v3_prevent_approval_manifest_mutation();
drop table if exists public.xab_v3_approval_manifests;
drop table if exists public.xab_v3_template_systems;
commit;
```

Do not run the rollback against production without a separately approved change packet and data-retention review.

## Mandatory validation

- TypeScript compile
- release lint
- unit tests
- migration parser/validation
- dependency audit
- Vercel preview READY
- desktop, tablet, and mobile BrowserWorker evidence
- no console or network errors
- 99% visual parity at every applicable breakpoint
- 100% operational parity
- approval-manifest tamper test
- cron authentication and five-minute schedule test
- rollback receipt

Missing evidence blocks promotion.

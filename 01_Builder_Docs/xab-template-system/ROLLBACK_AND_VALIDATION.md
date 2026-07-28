# Rollback and Validation Contract

## Current gate

This repair follows a production-first, validation-gated release policy. The staged Supabase migration is still unapplied. Preview is the active test boundary until every mandatory receipt passes.

Production promotion is the default next action after validation. Secret mutation, DNS changes, paid resources, customer messages, social publishing, destructive actions, and production database migrations still require their own scoped approval and rollback packet.

## Code rollback

1. Retain the last known-good production commit and deployment ID before promotion.
2. Revert the release commit or merge commit if production smoke testing fails.
3. Preserve the failed branch, logs, screenshots, and receipts for diagnosis.
4. Do not rewrite `main` history.

## Preview rollback

1. Retain the previous READY deployment ID.
2. Remove or retire the generated preview deployment.
3. Close or repair the generated pull request.
4. Preserve BrowserWorker screenshots, logs, and failure receipts.

## Production rollback

1. Run post-deployment smoke tests immediately after promotion.
2. If any critical route, authentication path, API, form, queue, or integration fails, restore the last known-good deployment.
3. Revert the release commit when the failure is code-related.
4. Mark the release receipt failed and open an isolated repair packet.
5. Re-run BrowserWorker and smoke testing before any second production attempt.

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

Do not run the migration or rollback against production without a separately approved database change packet, backup verification, and data-retention review.

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
- production smoke-test receipt
- final release receipt

Missing evidence blocks promotion. Passing every gate triggers production promotion as the default release action.

# Autonomous Backlog Engine V1 Rollback Plan

## Branch implementation rollback
Delete or close the feature branch / draft PR. Main is unchanged until separately approved.

## Code rollback after a future merge
Revert the Autonomous Backlog Engine merge commit. The existing factory cron continues operating even when the Backlog Engine schema is missing because the Backlog heartbeat reports a blocked state without blocking the canonical factory queue.

## Database rollback
Use `supabase/rollback/20260820065000_autonomous_backlog_engine_v1.down.sql` only after exporting any real evidence that must be retained and receiving explicit operator approval. The migration is additive and service-role-only.

## Production rollback
No production deployment or database migration is part of this mission. Any future release must record the prior Vercel deployment and verified DB backup/export strategy before approval.

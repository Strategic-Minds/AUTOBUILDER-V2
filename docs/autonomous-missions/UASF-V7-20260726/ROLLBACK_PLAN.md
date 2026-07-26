# Xtreme AI Builder Rollback Plan

Mission: `UASF-V7-20260726-001`

## Pre-change state

- Default branch: `main`
- Working branch: `auto-builder/uasf-v7-autonomous-discovery-20260726`
- Production aliases and default branch are unchanged.
- No Supabase schema or data mutation was performed.
- The Vercel deployment is a Git-connected Preview generated from the working branch.

## Rollback triggers

Rollback or quarantine the Preview when:

- release validation or build fails
- a critical security regression is discovered
- the status API exposes secrets or mutable authority
- the Preview produces blocking runtime errors
- source branch and deployment commit cannot be reconciled
- a repair lowers the accepted evidence score
- BrowserWorker discovers a blocking route, interaction, accessibility, console, network, or responsive defect

## GitHub rollback

1. Do not merge the draft pull request.
2. Revert only the failing commit on the feature branch or move the branch back to the last verified commit.
3. Preserve the failed commit SHA and validation receipt.
4. Trigger a new Preview from the corrected branch.
5. Re-run the exact failed test, then the broader regression suite.

The safest total rollback is to close the draft pull request and delete the feature branch after evidence is preserved. This requires explicit confirmation because branch deletion is destructive.

## Vercel rollback

1. Leave Production aliases untouched.
2. Stop using the failed Preview URL.
3. Restore the branch to the last verified commit.
4. Allow Git integration to create a replacement Preview.
5. Verify the replacement deployment source commit before testing.

No Production rollback is required because this mission is Preview-only.

## Supabase rollback

No database rollback is required for the current implementation because no migration or data write was performed.

Future isolated test migrations must include a paired `down` migration or a documented table/schema removal plan, and must never alter legacy tables during this mission.

## Google Drive rollback

The Drive workspace and control workbook copy are additive artifacts. Do not delete them during normal rollback. Mark the mission status as `ROLLED_BACK` or `QUARANTINED` and retain receipts for auditability.

## Protected actions

The following remain blocked without explicit operator approval:

- merge to the default branch
- Production deployment or alias promotion
- Production database migration
- secret or environment mutation
- paid resource creation
- domain or DNS changes
- destructive deletion

# Rollback Plan

## Controller installation rollback
Close the draft pull request without merging and delete branch `auto-builder/install-golden-universal-project-factory-v7-workbook`. The default branch remains unchanged.

## Pilot implementation rollback
- Keep the pilot implementation on a separate project branch.
- Every Preview must record its deployment ID and commit SHA.
- A failed repair attempt is reverted to the last passing project-branch commit.
- A failed Preview is not promoted.
- No production alias, domain, database, or environment mutation is authorized.

## Drive rollback
The workbook is stored as a raw XLSX with Drive file ID `1dI9te-lQ5hbbKWqMxnxrnjIz-ag1afI4`. Removing it from the pilot source-truth folder does not alter the original local or ChatGPT Library copies. Do not delete the Drive file without explicit operator approval.

## Base44 rollback
The pilot ProjectRegistry record ID is `6a656b8c88e986fbda449f60`. If the pilot is cancelled, update its queue state to `archived` and preserve its receipts. Do not delete historical records.

## Release rollback
Production remains locked. If a later production release is approved, its release packet must identify the prior production deployment and exact rollback command before promotion.

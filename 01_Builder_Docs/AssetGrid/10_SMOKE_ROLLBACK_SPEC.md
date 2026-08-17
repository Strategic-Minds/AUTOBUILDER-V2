# AssetGrid Smoke Test and Rollback Specification v1

Status: DRAFT / PREVIEW-ONLY
Owners: QA Recursive Repair Agent; Release-Rollback Agent

## Smoke test purpose
Prove the minimum critical marketplace paths operate after every preview build and after every artifact-changing repair.

## Critical smoke paths
1. health endpoint responds with expected safe status.
2. public home/category/search render without fatal console/network errors.
3. registration/login/recovery test account flow works in isolated preview.
4. published item detail loads metadata/media placeholder safely.
5. favorite/workspace create-read-delete test fixture obeys ownership.
6. cart -> checkout test-double -> order/entitlement fixture completes idempotently.
7. license -> signed-download test fixture grants only entitled account.
8. seller upload test fixture quarantines unsafe file and accepts safe fixture to review state.
9. author dashboard shows only owned portfolio/earnings fixtures.
10. admin test role can open moderation queue; non-admin receives denial.
11. AI test mode enforces quota and records provenance receipt.
12. queue worker claims one job, records receipt, and does not double-run same idempotency key.

## Smoke result
Any critical smoke failure = FAIL and creates RepairQueue item. No 'mostly passed' release claim.

## Rollback levels
### L1 code
Revert last branch commit/change packet.

### L2 preview deployment
Return to previous known-good preview deployment/artifact identity.

### L3 schema sandbox
Apply validated rollback SQL in isolated environment.

### L4 runtime queue
Quarantine failed job, release/expire lease safely, restore prior queue state from audit evidence where permitted.

### L5 production
Protected. Use only after explicit approval and exact production rollback receipt. Not authorized by overnight mode.

## Rollback prerequisites
Known-good artifact ID/commit; affected surface; rollback command/operation; data impact; receipt location; post-rollback smoke suite.

## Validation receipt
Every rollback produces reason, before/after artifact IDs, operator/agent, environment, tests, result, and unresolved risks.

## Gates
No production rollback/deploy/migration without protected approval unless an already-approved emergency rollback policy explicitly covers the exact scope.
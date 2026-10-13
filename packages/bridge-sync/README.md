# Base44 / X1 / ChatGPT Sync Preview

Status: **BRANCH-ONLY**, **NO PROVIDER WRITES**, **NOT ACTIVE IN LIVE RUNTIME**.

This new package is a *pure preview compiler*, not a replacement operating system, queue, cron, worker, memory layer or Base44 app. It adds structural enforcement to the existing GPT bridge's integration plan.

## Run synthetic tests

    cd packages/bridge-sync
    npm test

Uses Node.js built-in test runner, no paid service or environment variables.

## Current integration authority

- AUTO BUILDER V2 code authority: Strategic-Minds/AUTOBUILDER-V2 (this branch); confirm live SHA every run.
- Base44 orchestrator: 6a4ae522852a5e08bfa42450; existing Project/System/Workflow/Job/Approval/Receipt/Validation/Agent/Decision registries.
- Digital Dominance Base44 app: 6a77f4491f0bf92de9a3ed8b; separate product data and domain.
- X1 staging: uvdkzsbjackpjvpoxtyk; X1 production: vgsmyhqqtkkluhypxyua.
- ZERO Foresight plugin: Plugin_10a779448870819198f56ad65c3acb93.
- Website Launch Engine design/source is separate from the Digital Dominance donor.

## Precise contract

1. Fetch three records under validated user/tenant authorization: last ACKNOWLEDGED snapshot, Base44 current and authoritative current source.
2. Reject sensitive keys, anonymous actor, cross-tenant mappings and unverified baseline.
3. Compute stable canonical hashes and field-level three-way differences. Output contains digests, not field values.
4. Classify RETAIN, RETAIN_TARGET_CHANGED, ADD, PROPOSE_UPDATE, PROPOSE_REMOVE or CONFLICT. Conflicts never auto-resolve.
5. Generate deterministic packet IDs and idempotency keys. Mock DryRunLedger proves replay classification only; persistent storage must use the existing X1 receipt store.
6. For NEW creative work require independently validated and approved FORESIGHT_DECISION_RECEIPT. Preserve approved designs for ongoing projects.
7. Output PENDING_REVIEW, HOLD or CONFLICT. Never call Base44 or GitHub, enqueue X1 jobs, report LIVE, or schedule anything.
8. A future authenticated, separately approved adapter must acquire existing X1 lease, compare-and-set provider versions, perform one write, read back current state, request independent Guardian validation, and acknowledge stable receipt. None of these are implemented by this package.

### Known existing bridge risk

Existing app/api/gpt-bridge/route.ts forwards outbound messages and returns BASE44_ROUND_TRIP_COMPLETED based on HTTP response. That is **not** independent proof of completed builder action. It also advertises automatic_production_after_gates and production_target. DO NOT connect this preview to production. Separately audit authentic endpoint, authorization, verified output receipts and the release gate.

### Rollback

Remove/revert this branch's added files. They have no runtime consumers or background services. The existing X1 heartbeat and Base44 orchestrator remain unchanged.

### Tests / limitations

Synthetic tests cover replay, conflict, tenant/actor, data minimization, protected gates, three-way merge, foresight receipts, and independent readback checks. Structural validation of a receipt does not prove the receipt is authentic: that requires an authorized provider read and separate validator. GitHub CI and any deployed X1/Base44 integration must be verified independently.

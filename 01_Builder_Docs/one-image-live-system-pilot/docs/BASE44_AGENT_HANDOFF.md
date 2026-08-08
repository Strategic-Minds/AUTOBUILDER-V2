# Base44 Superagent Handoff

## PHASE
DISCOVERY

## STEP
ONE IMAGE PIPELINE PILOT

## Target
- Base44 app ID: `6a4ae522852a5e08bfa42450`
- Primary repo: `Strategic-Minds/AUTOBUILDER-V2`
- Branch: `auto-builder/one-image-pipeline-pilot-001`
- Environment: preview only

## Required behavior
1. Refuse to proceed when the approved image or Golden Workbook is missing, unhashed, or unapproved.
2. Record every requirement with a stable ID and source pointer.
3. Build from the approved image rather than replacing it with a generic design.
4. Use `Strategic-Minds/auto-builder-os` only as a UI donor.
5. Use `Strategic-Minds/AUTO_BUILDER-V1` only as a selective system donor.
6. Never bulk merge donor repositories.
7. Use one capability per commit.
8. Do not modify main, production, secrets, DNS, billing, payments, live databases, or customer communications.
9. Require receipts for every write, test, repair, deployment, and rollback action.
10. Stop after preview-acceptance evidence is prepared.

## Required outputs
- image intake receipt
- workbook intake receipt
- source-truth map
- requirements graph
- visual contract
- connector capability report
- dry-run provisioning receipt
- branch-build task graph
- validation report
- visual parity report
- repair receipts
- preview URL
- desktop and mobile screenshots
- rollback receipt
- preview-acceptance request

## Final status
Return one of:
- READY_FOR_DRY_RUN
- READY_FOR_BRANCH_BUILD
- READY_FOR_PREVIEW_ACCEPTANCE
- BLOCKED

End with VERIFIED, INFERRED, COULD NOT VERIFY, BLOCKERS, WORKAROUNDS, NEXT ACTIONS, and RELEASE GATE.

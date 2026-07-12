---
name: auto-builder-governance
description: use when any idea, implementation, workflow, agent, website, store, auto social system, or scaffold request must follow strategic minds auto_builder governance with validator-first gates, todo, phase, source truth, approval, receipts, and no production mutation without operator approval.
---

# auto-builder-governance

## Operating rules
- Enforce locked flow: PLAN -> DISCOVERY -> BRAND -> APPROVAL -> DOCS -> BUILD -> VALIDATE -> RELEASE.
- Start every run with TODO and PHASE / STEP.
- Operate as validator and orchestrator. Do not directly publish, spend, send customer messages, expose secrets, or mutate production.
- Require branch, sandbox, draft, or dry_run for all write-capable actions.
- End with VERIFIED, INFERRED, COULD NOT VERIFY, BLOCKERS, WORKAROUNDS, NEXT ACTIONS.

## Required output block
Always end with:
- VERIFIED
- INFERRED
- COULD NOT VERIFY
- BLOCKERS
- WORKAROUNDS
- NEXT ACTIONS

## Governance gates
- Read broadly.
- Write only to branch, sandbox, draft, or dry_run unless approved.
- Stop for production, secrets, payments, live publishing, customer messages, destructive actions, or spend.
- Emit receipts for validation, rollback, and approvals.

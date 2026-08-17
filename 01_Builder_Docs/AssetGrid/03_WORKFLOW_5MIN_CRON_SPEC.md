# AssetGrid Five-Minute Workflow / Cron Specification v1

Status: SPECIFIED, NOT ACTIVATED FOR ASSETGRID
Owner: Base44 APEX Build Orchestrator
Project: `assetgrid-clone-factory`
Canonical Base44 workflow: `assetgrid_clone_factory_5min`
Canonical route: `/api/cron/auto-builder`
Required schedule: `*/5 * * * *`

## Purpose
Use the existing AUTOBUILDER-V2 cron runtime, not duplicate infrastructure, as the durable operating heartbeat for approved AssetGrid work.

## Existing evidence
AUTOBUILDER-V2 already contains `/api/cron/auto-builder` and `lib/factory/run-factory-cron.ts`. `vercel.json` already registers `/api/cron/auto-builder`, `/api/cron/base44-bridge`, `/api/cron/quality-auto-heal`, and `/api/cron/resilience` at five-minute cadence. The latest identified main deployment for commit `cf1e7a161114bdd038385ba423d4a4e8e2c8e748` completed successfully on Vercel, but current Vercel team credentials in this session cannot inspect the Strategic Minds Advisory project runtime/logs.

## Heartbeat algorithm
1. Authorize internal request.
2. Verify `x-vercel-cron-schedule` when present equals `*/5 * * * *`.
3. Acquire/claim work through a transactional queue lease.
4. Restrict AssetGrid execution to packets whose project identity is `assetgrid-clone-factory` or its explicitly mapped transactional project ID.
5. Reject protected production mutations unless an exact approval receipt exists.
6. Claim the smallest eligible safe packet.
7. Execute one capability per mutation surface.
8. Validate the result.
9. On PASS, create validation/action receipt and release lease.
10. On FAIL, classify and route to RepairQueue or HardeningQueue.
11. Retry transient failures with bounded backoff.
12. Dead-letter repeated deterministic failures.
13. Leave the next eligible packet for the following heartbeat.

## AssetGrid execution states
`discovery`, `brand_provisional`, `docs_ready`, `preview_build`, `validating`, `repairing`, `hardening`, `waiting_approval`, `preview_validated`, `externally_blocked`.

## Safety policy
Allowed without new approval: reads, research, draft/spec generation, branch writes, preview builds, test doubles, local/preview tests, validation, repair, hardening, receipts.

Protected: production deploy, production DB migration/RLS, secrets/env mutation, real payments/payouts, spend, DNS, public publishing, customer messaging, destructive operations, permission changes.

## Idempotency
Pattern: `assetgrid:<job_id>:<artifact_hash>:<attempt_class>`.
A heartbeat must check durable receipt/job state before any mutation. Completed packets are never replayed only because cron fired again.

## Concurrency
Single-flight per project + mutation scope. Lease/fencing token required for writers. Validator may run concurrently only on immutable artifacts.

## Retry policy
- transient read/network: max 3 with exponential backoff
- ambiguous write: stop and reconcile receipts before retry
- deterministic validation failure: no blind retry; create repair packet
- protected action: mark waiting_approval and continue unrelated safe packets

## Queue priority
1. expired/stale lease recovery
2. failed validation with repair available
3. high/critical hardening finding
4. dependency-clearing validation/runtime work
5. current phase requirement packet
6. lower-priority enhancement

## Receipt contract
Each heartbeat writes or updates: worker ID, claimed job, project ID, idempotency key, start/end timestamp, action class, evidence references, validation result, next action, and rollback reference.

## Current blocker
Vercel Cron schedules run from the production deployment. This execution has read evidence of the existing production-hosted route but does not have access to the owning Vercel team (`strategic-minds-advisory` returns 403 through the connected Vercel account). Activating or changing production-hosted cron behavior is therefore both access-blocked and protected by overnight policy.

## Preview workaround
Continue all branch/docs/test-fixture work. Prepare AssetGrid transactional mapping and a manually invokable preview-safe worker contract without changing production. Once operator-approved Vercel team access and any required environment references are available, validate the existing production heartbeat rather than create a duplicate.

## Validation
- route exists
- schedule config exists
- build/CI passes on branch
- runtime authorization failure is fail-closed
- correct project scoping
- lease/idempotency tests
- retry/dead-letter tests
- protected-action tests
- receipt tests

## Rollback
Revert AssetGrid branch commits and restore Base44 workflow status to paused. Existing production cron remains unchanged until separately approved.
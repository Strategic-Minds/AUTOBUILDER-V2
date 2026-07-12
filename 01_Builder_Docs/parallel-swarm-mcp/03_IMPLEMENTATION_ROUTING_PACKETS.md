# AUTOBUILDER-V2 Controlled Autonomy Routing

## Mission
Turn ChatGPT into the command brain for AUTOBUILDER-V2 while durable queues, Base44, Codex, browser workers, GitHub, Vercel, and validation workers continue execution without an active chat session.

## Source truth
- Repository: `Strategic-Minds/AUTOBUILDER-V2`
- Branch: `build/parallel-swarm-mcp-v2-20260712`
- XAB is a separate sibling system and is not modified.
- Canonical MCP: `https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp`
- Base44 app ID: `6a4ae522852a5e08bfa42450`
- Vercel team ID: `team_aFdds8lsbHMwe2ip4aQdbQ3d`

## Packet 1, durable queue and ledger
Owner: Codex. Reviewer: Base44.
Implement idempotent intake, queue leases, resumable runs, events, ingestion manifests, browser sessions, completed-project records, cancellation, retry, and recovery.

## Packet 2, MCP autonomy surface
Owner: Codex. Reviewer: Base44.
Expose submit, inspect, list, cancel, retry, bulk ingest, browser task, queue status, artifact collection, and finalization tools through the authenticated MCP route.

## Packet 3, recursive swarm runtime
Owner: Base44. Reviewer: Codex.
Decompose missions into dependency-aware specialist packets, permit child specialists, persist results, arbitrate conflicts, and create focused repair packets.

## Packet 4, GitHub platform lane
Owner: Base44. Reviewer: Codex.
Synchronize accessible repositories, select or create a repository idempotently, create implementation branches and pull requests, and persist immutable evidence.

## Packet 5, Vercel platform lane
Owner: Base44. Reviewer: Codex.
Synchronize projects, select or create a Vercel project, link GitHub, request preview deployment, and persist project and deployment metadata.

## Packet 6, browser and five-minute recovery
Owner: Codex. Reviewer: Base44.
Operate headless and headful browser sessions, persist traces and screenshots, recover expired leases, and dispatch ready jobs every five minutes.

## Packet 7, validation and completion
Owner: Codex. Reviewer: Base44.
Run build, type, unit, integration, Playwright, security, and smoke checks. Repair failed layers, publish the completed-project record, and show repository, PR, Vercel project, preview, score, artifacts, and receipts in the dashboard.

## Completion rule
A project is complete only when a GitHub repository, implementation evidence, Vercel project, reachable preview, validation receipt, artifact manifest, and dashboard completion record all exist.

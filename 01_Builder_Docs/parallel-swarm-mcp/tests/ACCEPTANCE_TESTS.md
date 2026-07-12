# AUTOBUILDER-V2 Parallel Swarm Acceptance Tests

## Idea intake and unattended continuation

- AT-001: Submitting one dashboard idea creates exactly one durable `ideas` record and one root swarm run.
- AT-002: The API returns a tracking ID without waiting for the build to finish.
- AT-003: The run continues after the originating browser and chat session close.
- AT-004: A worker restart does not lose run, agent, packet, artifact, or receipt state.
- AT-005: A duplicate idea request with the same idempotency key does not create a second run.

## MCP discovery

- AT-101: The canonical MCP endpoint responds successfully.
- AT-102: Tool discovery includes `run_swarm`.
- AT-103: Tool discovery includes status, message, cancel, resume, agent-list, and inventory tools.
- AT-104: Existing create-repository and create-project tools remain discoverable.

## Parallel and recursive agents

- AT-201: One root run spawns at least three independent children concurrently.
- AT-202: One child agent spawns a grandchild.
- AT-203: The grandchild result reaches its parent and then the root.
- AT-204: The root returns one reconciled synthesis.
- AT-205: Agent paths are unique and hierarchical.
- AT-206: Context snapshots remain immutable.
- AT-207: Concurrency never exceeds the run limit.

## Queue, sandbox, and recovery

- AT-301: Packet dependencies prevent early execution.
- AT-302: Conflicting resource locks prevent simultaneous mutation of the same surface.
- AT-303: Each mutable packet receives an isolated branch, worktree, sandbox, or equivalent workspace.
- AT-304: An expired packet lease is recovered by the heartbeat.
- AT-305: Duplicate dispatch does not create duplicate external actions.
- AT-306: A failed packet requeues only the smallest failed work unit.

## GitHub

- AT-401: All three connected installations synchronize.
- AT-402: The sync represents the 102-repository snapshot or emits an explicit drift report.
- AT-403: Pagination continues until no repositories remain.
- AT-404: Repository rename detection uses immutable repository ID.
- AT-405: `create_github_repo` dry-run returns a complete plan.
- AT-406: Approved test creation returns repository ID and full name.
- AT-407: The created repository is immediately registered and available to the active run.
- AT-408: Repeating the same job ID does not create a second repository.

## Vercel

- AT-501: Team discovery returns `team_aFdds8lsbHMwe2ip4aQdbQ3d`.
- AT-502: Project sync returns the seven-project snapshot or emits an explicit drift report.
- AT-503: `create_vercel_project` dry-run returns a complete plan.
- AT-504: Approved test creation returns project ID and team ID.
- AT-505: The project registry links the Vercel project to its GitHub repository.
- AT-506: Repeating the same job ID does not create a duplicate Vercel project.
- AT-507: A preview deployment URL is persisted.

## Five-minute autonomous workflow

- AT-601: The heartbeat is configured for `*/5 * * * *`.
- AT-602: Concurrent heartbeat invocations acquire only one dispatcher lease.
- AT-603: Ready packets dispatch up to configured concurrency.
- AT-604: Stale GitHub and Vercel inventories refresh automatically.
- AT-605: Terminal packet completion triggers root reconciliation.
- AT-606: A run continues to progress with no active operator session.

## Validation and finished project

- AT-701: Every critical requirement ID has a terminal status.
- AT-702: Contradictory findings create an arbitration packet or explicit unresolved conflict.
- AT-703: Required build, lint, unit, integration, browser, and route tests produce machine-readable results.
- AT-704: Failed validation generates a focused repair packet and retry.
- AT-705: COMPLETE is impossible without GitHub repository, Vercel project, deployment URL, validation receipt, and root result.
- AT-706: The dashboard completed-project record displays repository, PR, Vercel project, deployment URL, validation, artifacts, and receipts.
- AT-707: Final status is COMPLETE, PARTIAL, FAILED, NEEDS_INPUT, or CANCELLED.
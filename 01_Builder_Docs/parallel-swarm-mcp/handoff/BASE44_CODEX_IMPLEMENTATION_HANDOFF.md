# Base44 and Codex Parallel Implementation Handoff

## Mission

Implement the AUTO BUILDER V2 autonomous idea-to-Vercel factory in `Strategic-Minds/AUTOBUILDER-V2` using the canonical MCP endpoint:

`https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp`

XAB is a separate sibling system. Do not modify `Strategic-Minds/XAB` from these packets.

## Operator outcome

An operator submits one idea through the AUTOBUILDER-V2 dashboard. The system persists the idea, decomposes it into work, launches recursive specialist agents in parallel, performs all build work in isolated sandboxes, creates or selects the GitHub repository, creates and links the Vercel project, validates the result, and publishes a completed-project record back to the dashboard. The workflow must continue without an active chat session.

## Canonical source package

`01_Builder_Docs/parallel-swarm-mcp/`

## Seven implementation packets

### ABV2-SWARM-001: Persistence and queue
Owner: Codex backend specialist

- Apply the reviewed Supabase migration from `supabase/queue_persistence.sql`.
- Add typed data access for ideas, runs, agents, packets, events, messages, results, artifacts, receipts, locks, GitHub inventory, Vercel inventory, and completed projects.
- Implement idempotent queue insertion and atomic packet claiming.

### ABV2-SWARM-002: MCP swarm tools
Owner: Base44 connector specialist

- Add `run_swarm`, `get_swarm_status`, `message_swarm`, `cancel_swarm`, `resume_swarm`, `list_swarm_agents`, `sync_github_inventory`, and `sync_vercel_inventory`.
- Preserve existing repository, Vercel, workflow, agent, gateway, and rollback tools.
- Validate all inputs and outputs against the included schemas.

### ABV2-SWARM-003: Recursive multi-agent runtime
Owner: Codex AI runtime specialist

- Implement the root Responses API multi-agent runner.
- Persist response IDs and agent tree events.
- Support recursive child and grandchild spawning, bounded concurrency, retries, parent result collection, and root synthesis.
- Continue execution from persistent state when the initiating chat is gone.

### ABV2-SWARM-004: GitHub inventory and repository creation
Owner: Base44 platform specialist

- Synchronize all connected GitHub installations with pagination.
- Wrap `create_github_repo` with idempotency and registry upsert.
- Make a newly created repository immediately available to the active run.
- Provide isolated branch or worktree bindings per packet.

### ABV2-SWARM-005: Vercel inventory and project creation
Owner: Base44 Vercel specialist

- Synchronize the Strategic Minds Advisory team inventory.
- Wrap `create_vercel_project` with idempotency and registry upsert.
- Link Vercel project records to GitHub repository records.
- Publish preview and final project URLs into the completed-project record.

### ABV2-SWARM-006: Autonomous heartbeat and dispatcher
Owner: Codex workflow specialist

- Implement `/api/cron/swarm-heartbeat` and configure `*/5 * * * *`.
- Add dispatcher leases, stale lease recovery, retries, inventory refresh, result reconciliation, and completed-project publication.
- Ensure the system progresses even when no user or chat session is active.

### ABV2-SWARM-007: Validation and dashboard completion
Owner: Base44 QA and dashboard specialist

- Implement acceptance tests from `tests/ACCEPTANCE_TESTS.md`.
- Add machine-readable test results and final validation receipts.
- Add dashboard states for IDEA RECEIVED, QUEUED, PLANNING, BUILDING, TESTING, DEPLOYING, COMPLETE, FAILED, and NEEDS INPUT.
- COMPLETE must display the GitHub repository, Vercel project, deployment URL, validation result, artifacts, and receipts.

## Parallelization map

Packets 001, 002, 004, and 005 may start immediately.
Packet 003 depends on the queue interfaces from 001 and the tool contracts from 002.
Packet 006 depends on 001 and may integrate 003, 004, and 005 incrementally.
Packet 007 begins with test scaffolding immediately and completes after 003 through 006.

## Required completion evidence

- Branch names and commit SHAs
- Pull request URLs
- MCP discovery output
- Database migration result
- Agent trace showing child and grandchild agents
- GitHub and Vercel inventory drift reports
- Repository and Vercel creation idempotency tests
- Five-minute heartbeat recovery test
- Dashboard completed-project record
- Final acceptance-test report
- Validation receipt and rollback reference

## Result contract

Each packet returns completed work, changed files, commit SHAs, tests, unresolved blockers, artifact references, receipt references, and rollback references.
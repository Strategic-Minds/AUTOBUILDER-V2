# AUTO BUILDER V2 Parallel Swarm MCP Specification

## Document control

- Specification ID: `ABV2-SWARM-MCP-001`
- Version: `1.1.0`
- Date: `2026-07-12`
- Target repository: `Strategic-Minds/AUTOBUILDER-V2`
- Target branch: `build/parallel-swarm-mcp-v2-20260712`
- Canonical MCP endpoint: `https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp`
- Vercel team: `Strategic Minds Advisory`
- Vercel team ID: `team_aFdds8lsbHMwe2ip4aQdbQ3d`
- Base44 control plane: `AUTO BUILDER ORCHESTRATOR`
- Base44 app ID: `6a4ae522852a5e08bfa42450`

## System boundary

`Strategic-Minds/AUTOBUILDER-V2` is the autonomous test factory covered by this specification.

`Strategic-Minds/XAB` is a separate sibling system with similar concepts. This specification does not merge, replace, or modify XAB.

## Operator outcome

The operator enters an idea in the AUTOBUILDER-V2 dashboard and leaves. The system continues asynchronously and eventually writes a completed-project record containing:

- final GitHub repository
- implementation branch and pull request
- Vercel project
- deployment URL
- validation score and test report
- generated artifacts
- execution receipts
- failure or needs-input state when completion is not possible

No continuous chat session is required after submission.

## End-to-end autonomous flow

```text
Dashboard idea intake
  -> IdeaRegistry record
  -> durable queue entry
  -> source-truth and requirement decomposition
  -> project plan and task dependency graph
  -> isolated sandbox/worktree allocation
  -> recursive parallel specialist swarm
  -> implementation and repair loops
  -> GitHub repository selection or creation
  -> branch commits and pull request
  -> Vercel project selection or creation
  -> preview deployment
  -> automated validation
  -> repair and redeploy until terminal
  -> CompletedProject record
  -> dashboard COMPLETE state
```

## Core runtime responsibilities

### Idea intake service

The dashboard submits an idea to `POST /api/ideas` with an idempotency key. The service creates:

- `idea_id`
- `project_key`
- `title`
- `mission`
- `requested_outputs`
- `priority`
- `status=IDEA_RECEIVED`
- `created_by`
- `created_at`

It then enqueues a root swarm run and immediately returns a durable tracking ID.

### Root orchestrator

The root orchestrator must:

1. load the idea and current source truth
2. create immutable requirement IDs
3. create a dependency graph
4. choose permanent or dynamic specialist roles
5. dispatch independent packets concurrently
6. permit bounded child and grandchild agent creation
7. persist all events and results
8. arbitrate conflicting findings
9. trigger repair packets for failed validations
10. synthesize the final project result

### Specialist agents

The default specialist registry includes:

- source-truth-discovery-agent
- workbook-intelligence-agent
- product-architecture-agent
- repository-consolidation-agent
- frontend-visual-parity-agent
- backend-supabase-agent
- connector-mcp-agent
- github-platform-agent
- vercel-platform-agent
- vercel-workflow-agent
- qa-recursive-repair-agent
- security-review-agent
- release-rollback-agent
- receipt-audit-agent
- memory-intelligence-agent

Dynamic specialists may be created when the mission requires a capability not covered by the registry.

## Recursive agent model

Every agent record contains:

- `run_id`
- `agent_id`
- `parent_agent_id`
- `agent_path`
- `role_key`
- `task_packet_id`
- `context_snapshot_id`
- `allowed_tools`
- `workspace_binding`
- `status`
- `response_id`
- timestamps

Example tree:

```text
/root
/root/product-architecture
/root/frontend
/root/frontend/mobile
/root/backend
/root/backend/data-model
/root/platform
/root/platform/github
/root/platform/vercel
/root/qa
/root/qa/playwright
/root/qa/repair
```

A child may only spawn descendants for independent subproblems derived from its assigned packet. The parent remains responsible for combining descendant results.

## Parallel task packets

Each packet contains:

- immutable `packet_id`
- related requirement IDs
- owner role
- dependencies
- resource locks
- sandbox or worktree binding
- input references
- expected outputs
- acceptance tests
- retry policy
- risk class
- status

Dependency-free packets become `READY`. The dispatcher claims packets atomically up to the run concurrency budget.

## MCP tool additions

The canonical MCP gateway must expose:

- `run_swarm`
- `get_swarm_status`
- `message_swarm`
- `cancel_swarm`
- `resume_swarm`
- `list_swarm_agents`
- `sync_github_inventory`
- `sync_vercel_inventory`

Existing integrated tools remain available:

- `create_github_repo`
- `create_vercel_project`
- `create_vercel_workflow`
- `create_vercel_agent`
- `create_ai_gateway`
- `rollback`

### run_swarm request

```json
{
  "job_id": "idea-idempotency-key",
  "idea_id": "idea_...",
  "mission": "Build the requested system",
  "project_key": "AUTO_BUILDER_V2",
  "mode": "execute",
  "max_concurrency": 8,
  "max_agent_depth": 4,
  "specialist_policy": "dynamic_plus_registry",
  "github_scope": {
    "include_all_accessible": true
  },
  "vercel_scope": {
    "team_id": "team_aFdds8lsbHMwe2ip4aQdbQ3d",
    "include_all_accessible": true
  },
  "acceptance_criteria": [],
  "requested_outputs": []
}
```

### run_swarm response

```json
{
  "run_id": "swr_...",
  "idea_id": "idea_...",
  "status": "QUEUED",
  "root_agent_id": "agt_...",
  "tracking_url": "/projects/project-id",
  "receipt_ids": []
}
```

## Persistent queue

The required durable tables are:

- `ideas`
- `swarm_runs`
- `swarm_agents`
- `swarm_task_packets`
- `swarm_dependencies`
- `swarm_events`
- `swarm_messages`
- `swarm_results`
- `swarm_artifacts`
- `swarm_receipts`
- `resource_locks`
- `github_installations`
- `github_repository_registry`
- `vercel_team_registry`
- `vercel_project_registry`
- `completed_projects`

No essential execution state may live only in process memory.

## State machines

### Idea and project state

```text
IDEA_RECEIVED
  -> QUEUED
  -> PLANNING
  -> BUILDING
  -> TESTING
  -> DEPLOYING
  -> COMPLETE
```

Alternative terminal or pause states:

- `FAILED`
- `NEEDS_INPUT`
- `CANCELLED`

### Packet state

```text
DRAFT -> BLOCKED -> READY -> CLAIMED -> RUNNING -> SUCCEEDED
                                  |         |
                                  |         -> FAILED -> RETRY_READY
                                  |                         |
                                  |                         -> TERMINAL_FAILED
                                  -> CANCELLED
```

## Sandbox isolation

Every mutable implementation packet must receive one of:

- isolated Git branch
- isolated Git worktree
- Vercel Sandbox
- approved equivalent ephemeral workspace

Resource locks prevent concurrent modification of the same repository path, database schema, Vercel project, or deployment surface.

## GitHub connection

Runtime discovery must enumerate all connected GitHub App installations and paginate all repositories. The 2026-07-12 snapshot contained:

- Strategic-Minds: 73 repositories
- XPS-IINTELLIGENCE-SYSTEMS: 19 repositories
- xps-admin: 10 repositories
- total: 102 repositories

The snapshot is informational. Runtime inventory is authoritative.

### Repository creation

When no suitable repository exists:

1. create an idempotent provisioning packet
2. call `create_github_repo`
3. retrieve immutable repository metadata
4. upsert the repository registry
5. emit `github.repository.created`
6. bind implementation packets to the new repository
7. continue the same swarm run without manual reconfiguration

## Vercel connection

Runtime discovery synchronizes all projects in team `team_aFdds8lsbHMwe2ip4aQdbQ3d`.

### Project creation

When no suitable Vercel project exists:

1. resolve project name, framework, root directory, and Git repository
2. call `create_vercel_project`
3. retrieve project metadata
4. upsert the Vercel project registry
5. link the GitHub repository record
6. create preview deployment work
7. emit `vercel.project.created`
8. continue validation and repair

## Autonomous heartbeat

Route: `/api/cron/swarm-heartbeat`

Schedule: `*/5 * * * *`

Each heartbeat must:

1. acquire a dispatcher lease
2. recover expired packet and agent leases
3. refresh stale connector inventories
4. move dependency-satisfied packets to READY
5. claim and dispatch packets up to concurrency limits
6. reconcile active model and tool jobs
7. persist events and results
8. enqueue focused repair packets
9. detect terminal project state
10. publish or update the completed-project record
11. write a heartbeat receipt

The heartbeat must be idempotent and safe under overlapping invocations.

## Result synthesis

Every packet result includes:

- summary
- requirement results
- artifacts
- evidence
- tests
- findings
- conflicts
- follow-up packets
- receipt IDs

The root groups all results by requirement ID, resolves contradictions using direct runtime evidence, and creates arbitration packets when needed.

## Dashboard contract

The dashboard must display:

- idea title and mission
- current lifecycle state
- queue position
- active and completed packets
- live agent tree
- latest event
- GitHub repository and pull request
- Vercel project and deployment URL
- test and validation status
- blockers or needs-input request
- completed artifacts and receipts

The operator does not need to converse with agents for routine progress.

## Completion criteria

A project can enter `COMPLETE` only when:

1. every critical requirement has a terminal result
2. source code exists in the selected or created GitHub repository
3. the Vercel project exists and is linked
4. a deployment URL is recorded
5. required automated tests pass
6. unresolved critical defects equal zero
7. the root synthesis is persisted
8. a validation receipt exists
9. a completed-project dashboard record exists

## Seven implementation packets

- ABV2-SWARM-001: persistence and queue
- ABV2-SWARM-002: MCP swarm tools
- ABV2-SWARM-003: recursive multi-agent runtime
- ABV2-SWARM-004: GitHub inventory and creation
- ABV2-SWARM-005: Vercel inventory and creation
- ABV2-SWARM-006: autonomous heartbeat and recovery
- ABV2-SWARM-007: validation and dashboard completion

## Acceptance summary

The implementation passes when an idea can be submitted once, continue without an active chat, create a recursive parallel agent tree, create or select a GitHub repository, create or select a Vercel project, deploy and validate the result, recover from an interrupted worker, avoid duplicate resources on retry, and publish a complete dashboard record.
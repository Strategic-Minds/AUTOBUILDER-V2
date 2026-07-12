# AUTOBUILDER-V2 Vercel Autonomous Runtime Contract

## Canonical surfaces

- MCP URL: `https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp`
- Vercel team: `Strategic Minds Advisory`
- Team ID: `team_aFdds8lsbHMwe2ip4aQdbQ3d`
- Target repository: `Strategic-Minds/AUTOBUILDER-V2`

## Required routes

- `POST /api/ideas`: accept one dashboard idea and return a durable tracking ID
- `GET /api/ideas/{idea_id}`: return lifecycle and completed-project state
- `POST /api/swarm/runs`: create or resume the root run
- `GET /api/swarm/runs/{run_id}`: summarize run, packets, agents, artifacts, and blockers
- `POST /api/swarm/runs/{run_id}/message`: persist an operator follow-up when needed
- `POST /api/swarm/runs/{run_id}/cancel`: cancel eligible work
- `POST /api/swarm/runs/{run_id}/resume`: resume recoverable work
- `POST /api/inventory/github/sync`: refresh all GitHub installations and repositories
- `POST /api/inventory/vercel/sync`: refresh Vercel teams and projects
- `GET|POST /api/cron/swarm-heartbeat`: autonomous dispatcher and recovery loop
- `GET /api/projects/{project_id}`: dashboard project detail

## Cron configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/swarm-heartbeat",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Idea submission behavior

1. Validate the request and idempotency key.
2. Insert or retrieve the idea record.
3. Create or retrieve the root swarm run.
4. Enqueue the first planning packet.
5. Return HTTP 202 with idea ID, run ID, project tracking route, and current state.
6. Do not hold the request open for the build.

## Heartbeat behavior

Every heartbeat:

1. authenticates the cron call
2. acquires one dispatcher lease
3. recovers expired packet, agent, and resource leases
4. refreshes stale GitHub and Vercel inventories
5. promotes dependency-satisfied packets to READY
6. claims packets atomically up to concurrency capacity
7. starts or resumes model, connector, sandbox, build, test, and deployment work
8. persists events before and after each external call
9. collects terminal results
10. enqueues focused repair packets
11. triggers root reconciliation when critical work is terminal
12. writes or updates the completed-project record
13. emits a heartbeat receipt
14. releases the dispatcher lease

## Long-running execution

- Essential state must be committed before the request ends.
- Model response IDs and continuation metadata must be persisted.
- GitHub, Vercel, sandbox, build, and test jobs must use durable job IDs.
- Workers may return early and rely on future heartbeat invocations.
- Idempotent retries must not duplicate repositories, projects, branches, deployments, or packet results.

## GitHub creation integration

`create_github_repo` accepts:

- `job_id`
- `owner`
- `repo_name`
- `visibility`
- `description`
- `initialize_readme`
- `mode`

After creation, the runtime retrieves immutable metadata, upserts `github_repository_registry`, emits `github.repository.created`, and binds the repository to the active run.

## Vercel project creation integration

`create_vercel_project` accepts:

- `job_id`
- `team_id`
- `project_name`
- `git_repo`
- `framework`
- `root_directory`
- `mode`

After creation, the runtime retrieves project metadata, upserts `vercel_project_registry`, links the GitHub repository, emits `vercel.project.created`, and schedules preview deployment work.

## Sandbox contract

Each mutable packet receives a unique sandbox binding containing:

- sandbox or worktree ID
- repository and branch
- base commit
- filesystem root
- packet ID
- lease expiry
- cleanup state

Sandboxes must be disposable and must not share mutable workspaces across concurrent packets.

## Completed-project publication

The runtime writes `completed_projects` only after root reconciliation. The record includes:

- project and idea IDs
- terminal status
- GitHub repository and branch
- pull request URL
- Vercel project ID and name
- deployment URL
- validation result and score
- artifacts
- receipts
- final summary

## Environment variable names

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY`
- `GITHUB_WEBHOOK_SECRET`
- `VERCEL_ACCESS_TOKEN`
- `VERCEL_TEAM_ID`
- `CRON_SECRET`
- `BASE44_API_KEY` when direct Base44 API use is enabled

Only variable names belong in source-controlled documentation. Secret values do not.
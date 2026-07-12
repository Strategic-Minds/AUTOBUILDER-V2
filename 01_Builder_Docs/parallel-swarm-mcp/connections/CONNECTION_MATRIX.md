# AUTOBUILDER-V2 Autonomous Connection Matrix

## Installed runtime path

`dashboard idea -> Supabase queue -> five-minute heartbeat -> AI Gateway router -> provider adapter -> GitHub/Vercel/MCP -> receipt -> dashboard`

## Required connections

| Connection | Purpose | Supported path |
|---|---|---|
| Supabase | Queue, leases, retries, receipts, completion state | REST service-role adapter |
| OpenAI / AI Gateway | Planning, recursive agents, review, synthesis | Responses API with multi-agent beta header |
| Base44 | UI and app implementation lane | Base44 agent messages endpoint |
| Codex | Repository implementation, tests, repairs | Execution endpoint, MCP, or GitHub-backed adapter |
| GitHub | Inventory, repository creation, branches, commits, PRs | GitHub MCP, token, or GitHub App |
| Vercel | Project creation, Git linking, previews, deployment state | Vercel MCP or team token |
| AUTO BUILDER MCP | Unified platform tool surface | Canonical MCP endpoint |

## Optional but installed connections

- n8n workflow fan-out
- Playwright/Browser Worker
- Google Drive MCP
- Slack, Google Chat, or email completion notifications
- OpenTelemetry or Sentry observability

## Runtime routes

- `POST /api/autonomy/ideas`
- `GET /api/autonomy/ideas`
- `POST /api/autonomy/dispatch`
- `GET /api/autonomy/health`
- `GET|POST /api/mcp`
- `GET /api/cron/swarm-heartbeat`

## MCP tools

- `submit_autonomous_build`
- `get_autonomous_build`
- `list_autonomous_builds`
- `cancel_autonomous_build`
- `retry_autonomous_build`
- `run_swarm`
- `connection_status`

## Autonomy behavior

The dashboard writes a durable job and immediately returns a run ID. The five-minute heartbeat claims independent jobs concurrently. The AI Gateway router selects Base44, Codex, OpenAI multi-agent, GitHub, Vercel, MCP, browser, Drive, or n8n based on task class and configured providers. Failed providers fall through to the next configured lane. Every terminal result writes a receipt.

## Production activation checklist

1. Add the required environment variables from `.env.autonomy.example` to the Vercel project.
2. Apply the queue persistence migration from `supabase/queue_persistence.sql`.
3. Confirm `/api/autonomy/health` reports all required connections configured.
4. Call MCP `connection_status`.
5. Submit a sandbox idea.
6. Verify queue claim, provider execution, receipt, GitHub output, Vercel project, and final dashboard record.

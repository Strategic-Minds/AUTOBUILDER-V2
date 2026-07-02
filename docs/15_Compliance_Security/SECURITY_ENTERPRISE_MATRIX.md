# Enterprise Security Matrix

## Required controls
- Least privilege OAuth scopes.
- Separate staging and production keys.
- No secrets in GitHub, Drive, prompts, screenshots, logs, or downloadable packages.
- Supabase RLS enabled on every tenant-facing table.
- Service role usage restricted to server-only routes.
- Webhook signature validation for providers that support it.
- Idempotency keys on send, deploy, billing, and webhook handlers.
- Approval gate for destructive actions.
- Audit logs for all agent and tool actions.
- Rollback plan for every release.

## MCP/tool gates
Every tool action must be classified as:
- read_safe
- draft_safe
- branch_safe
- dry_run_required
- approval_required
- production_blocked

## Security receipt fields
- actor
- agent_id
- tool_name
- scope_requested
- scope_granted
- action_class
- approval_id
- receipt_id
- rollback_id
- timestamp

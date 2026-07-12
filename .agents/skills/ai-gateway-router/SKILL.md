---
name: ai-gateway-router
description: use when auto_builder must route ai calls through vercel ai gateway or another governed model router with budgets, fallback logic, provider boundaries, telemetry, and prompt receipts.
---

# ai-gateway-router

## Operating rules
- Use one routing layer for GPTs, Base44 agent, Codex, n8n, and workflow agents.
- Define primary, secondary, and fallback model intent per task.
- Record request class, model, cost tier, latency, error, and fallback in receipts.
- Do not store secrets in prompts or docs.

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

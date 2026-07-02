---
name: release-train-manager
description: Manage sandbox, preview, staging, production release trains, branch promotion, deployment gates, rollback plans, migration review, and release receipts. Use when AUTO_BUILDER needs enterprise-grade autonomous swarm operations, safety gates, receipts, and scalable multi-tenant business-system execution.
---

# Release Train Manager

## Mission
Manage sandbox, preview, staging, production release trains, branch promotion, deployment gates, rollback plans, migration review, and release receipts.

## Mandatory operating rules
- Start with PHASE, STEP, and TODO.
- Default to branch, sandbox, draft, dry_run, or preview.
- Never mutate production, send customer messages, spend money, change secrets, apply database migrations, publish social content, change DNS, or create accounts without explicit operator approval.
- Write receipts for every action, blocker, approval, rollback, and validation result.
- Mark facts as VERIFIED, INFERRED, or COULD NOT VERIFY.

## Required outputs
- Scope
- Inputs needed
- Source truth checked
- System path affected
- Supabase tables affected
- Drive folders affected
- Tool permissions required
- Approval gate
- Validation receipt
- Rollback path

## Stop conditions
Stop and escalate on secrets, payments, live publishing, live customer messages, legal/compliance risk, PII risk, destructive operations, provider billing changes, or missing source truth.

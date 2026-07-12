---
name: auto-builder-enterprise-kernel
description: Route every AUTO_BUILDER enterprise request through the master kernel for manifests, agents, tools, schedules, templates, receipts, approvals, and releases. Use when AUTO_BUILDER needs enterprise-grade agent automation, orchestration, scaffolding, workflow control, validation, memory, communication, intelligence, or release governance for websites, lead gen, auto social, business systems, XPS locations, PUC attendee systems, or Strategic Minds licensing.
---

# Auto Builder Enterprise Kernel

## Purpose
Route every AUTO_BUILDER enterprise request through the master kernel for manifests, agents, tools, schedules, templates, receipts, approvals, and releases.

## Operating contract
- Start with PHASE, STEP, TODO when this skill is active.
- Keep work branch-safe, sandboxed, draft-only, or dry_run unless operator approval is explicit.
- Read source truth before planning implementation.
- Emit receipts for decisions, validations, approvals, blockers, and rollbacks.
- Stop for production deploys, secrets, payments, live publishing, customer messages, destructive database actions, DNS, account provisioning, or spend.

## Required inputs
- request_id
- operator_intent
- source_truth_links_or_paths
- agent_scope
- tool_scope
- Drive_scope
- Supabase_scope
- approval_state

## Required outputs
- decision_summary
- verified_facts
- inferred_items
- blocked_items
- receipt_requirements
- rollback_requirements
- next_actions

## Validation checklist
- Confirm source truth exists or mark missing.
- Confirm required tables, folders, templates, or routes are named explicitly.
- Confirm no live mutation is requested without approval.
- Confirm every action maps to a receipt.
- Confirm rollback or fallback exists.

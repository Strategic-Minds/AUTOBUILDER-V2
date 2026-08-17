# AssetGrid Optional Integration Specification v1

Status: DRAFT
Owner: Base44 APEX Build Orchestrator

## Google Chat
Not required for the core buyer/seller marketplace. If later approved, Google Chat may receive internal queue/incident/approval notifications only. It must not become the system of record. Outbound team notifications are protected live communications and remain disabled overnight.

## Auto Social
Not required for core AssetGrid preview validation. A future seller/marketplace marketing module may create draft social content queues, but no live social publishing is authorized. Keep outside the critical marketplace build graph until core buyer/seller/admin/validation requirements pass.

## n8n
Optional for integrations that cannot be cleanly handled by Vercel Workflow or native provider APIs. Do not duplicate the canonical five-minute queue heartbeat.

## Google Workspace
Drive/Docs/Sheets may later hold human-readable exports, product review packets, seller documentation, and operating reports. Connector authorization remains operator/OAuth gated.

## Acceptance
Any optional integration must have least-privilege scopes, explicit ownership, idempotency, failure/retry behavior, audit receipt, and rollback/disconnect plan.

## Current decision
Core preview readiness does not depend on Google Chat or Auto Social. Their absence does not block AssetGrid core marketplace validation.

## Rollback
No integration has been activated by this document.
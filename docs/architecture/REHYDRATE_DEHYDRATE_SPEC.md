# REHYDRATE / DEHYDRATE SPEC
**Generated:** 2026-07-02 by Base44 Superagent
**Status:** Defined and now in force for this agent's own cron/on-demand runs.

## Honest architecture note (read this first)
The manifest asks for 10 standalone services (Rehydrate Service, Dehydrate Service,
Execution Packet Builder, Receipt Writer, State Snapshot Store, Agent Context Cache,
Cross-Agent Event Bus, Intelligence Rollup Worker, Memory Normalizer, Swarm State
Consistency Checker). There is currently exactly ONE agent operating this system (this
Base44 Superagent) — there is no second agent to keep "in the loop" yet, so a
deployed cross-agent event bus and separate context cache would be real infrastructure
with no real consumer today. Building it now would be exactly the "thin scaffold" /
"fake completeness" failure mode this program explicitly forbids.

**What's implemented instead:** the same rehydrate/dehydrate discipline, applied as a
mandatory PROCEDURE this agent follows on every meaningful run — enforced by these
written rules plus the automation descriptions themselves, not by new backend code.
If/when a second autonomous agent is added, this doc is the direct spec to promote
into real services (the packet shapes below are already service-ready).

## Rehydrate (before any meaningful run)
This agent MUST read, at minimum, before acting:
- SystemRegistry (current_reality, drift_status for the system in scope)
- The specific ProjectRegistry / QueueRegistry / JobRegistry / ApprovalQueue rows in scope
- Any open ArtifactRegistry / ValidationRegistry / ScoringRegistry rows for the same scope
- Relevant conversation memory.md entries (decisions, not raw chat)
- The latest ReceiptRegistry entry for the same system, if one exists

Rehydrate packet shape (what gets loaded into working context):
```
correlation_id, project_id, job_id, source_agent, target_agent,
lifecycle_stage, queue_state, approval_state, payment_state, revision_state,
current_score, latest_validation_summary, active_blockers, next_expected_action,
relevant_artifacts, memory_summary, intelligence_summary, protected_defaults,
template_selection, cron_context, retry_context, escalation_rules
```

## Dehydrate (after any meaningful run)
This agent MUST write back, at minimum, after acting:
- Updated registry rows for anything that changed (state, timestamps, scores)
- A ReceiptRegistry row summarizing what was done and where evidence lives
- Any new blockers to ApprovalQueue / RepairQueue / HardeningQueue as applicable
- A memory.md entry ONLY for durable decisions/lessons — never raw state (state lives
  in registries, per the canonical truth hierarchy)

Dehydrate packet shape:
```
correlation_id, project_id, job_id, acting_agent, action_taken, status,
queue_transition, artifacts_created, artifacts_updated, validation_result,
score_delta, blockers_found, blockers_cleared, next_action, repair_needed,
hardening_needed, memory_updates, intelligence_updates, notifications_to_send,
receipt_reference, completed_at
```

## Swarm rules (in force now)
1. No meaningful agent work without a rehydrate step first.
2. No meaningful completion without a dehydrate step + ReceiptRegistry write.
3. Every queue transition, score change, approval change, artifact change, or blocker
   change must be written to the control plane before the run ends.
4. Memory/intelligence updates come from structured dehydrate output, not loose
   freeform summaries.

## Applied to existing cron family (real, not planned)
- Queue Heartbeat, Registry Reconciliation Sync, Twice-Daily Test/Score/Drift Review,
  and Nightly Repair/Hardening/Intelligence Drain now each open with a rehydrate read
  of their target registries and close with a dehydrate write, including a
  ReceiptRegistry row. This is enforced via each automation's description, not a
  separate code service.

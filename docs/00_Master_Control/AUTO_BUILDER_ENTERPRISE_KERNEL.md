# AUTO_BUILDER Enterprise Kernel

## Kernel objective
Classify every operator request, select the correct skill/agent/tool, create a task record, enforce gates, route work to the correct system, score output, and record receipts.

## Locked sequence
PLAN -> DISCOVERY -> BRAND -> APPROVAL -> DOCS -> BUILD -> VALIDATE -> RELEASE -> OPERATE

## Request classifier
- idea_request: plan only
- website_request: discovery, brand, docs, scaffold, validate
- system_request: architecture, docs, Supabase, Vercel, workflows, validate
- auto_social_request: content system, approvals, schedule, gated publish
- intelligence_request: discover, ingest, classify, analyze, store
- agent_request: create agent template and registry entry
- license_request: package, tenant, entitlement, support, renewal
- repair_request: reproduce, diagnose, patch, validate, score

## Kernel state machine
1. Create task in swarm_tasks.
2. Assign owning agent and support subagents.
3. Load source truth from Drive, GitHub, Supabase, and user input.
4. Produce plan and risks.
5. Stop for approvals where required.
6. Generate docs and branch-safe scaffold.
7. Run QA/evals.
8. Auto-heal in preview up to MAX_AUTO_HEAL_ITERATIONS.
9. Issue release recommendation only if score threshold is met.
10. Archive receipts.

## Gates
- G0 Read-only discovery
- G1 Draft docs and templates
- G2 Branch scaffold
- G3 Preview deploy
- G4 Controlled live release
- G5 Operate and schedule

## Release threshold
Default release threshold: 95/100 with no critical failures.
100/100 is an optimization target, not a guarantee.

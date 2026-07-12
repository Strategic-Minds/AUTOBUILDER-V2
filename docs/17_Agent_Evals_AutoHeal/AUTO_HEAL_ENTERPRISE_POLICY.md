# Auto-Heal Enterprise Policy

## Purpose
Allow the system to repair preview/sandbox failures while blocking uncontrolled production mutation.

## Loop
1. Detect failure.
2. Classify severity.
3. Identify owner agent/skill/tool.
4. Create branch-safe patch plan.
5. Apply patch in preview branch only.
6. Run unit, route, build, lint, Playwright, accessibility, security, and business logic checks.
7. Score result.
8. Repeat until threshold or iteration limit.
9. Produce receipt.
10. Stop for approval before production.

## Limits
- MAX_AUTO_HEAL_ITERATIONS=5 by default.
- MAX_PARALLEL_PATCH_AGENTS=3 by default.
- Never patch secrets, DNS, billing, payments, customer messages, production database, or production deployment without approval.

## Score thresholds
- 100: ideal, release candidate after human review.
- 95-99: release review eligible with notes.
- 90-94: staging only.
- 80-89: continue repair.
- below 80: stop and escalate.

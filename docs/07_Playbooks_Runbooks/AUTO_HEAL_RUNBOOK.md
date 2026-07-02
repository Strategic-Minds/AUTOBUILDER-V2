# Auto-Heal Runbook

## Purpose
Improve preview branch quality through repeated diagnose -> patch -> test -> score loops.

## Loop
1. Run build/lint/typecheck.
2. Run Playwright Chromium tests.
3. Run route/API smoke checks.
4. Run PWA checks.
5. Run accessibility and SEO checks.
6. Score results.
7. Identify failing category.
8. Apply smallest branch-safe patch.
9. Re-run tests.
10. Record receipt.
11. Continue until threshold or max iterations.

## Defaults
- MAX_AUTO_HEAL_ITERATIONS=5
- RELEASE_THRESHOLD=95
- PRODUCTION_MUTATION=false

## Stop conditions
- Critical security issue
- Missing credential
- Destructive action needed
- Production-only fix needed
- External provider outage
- Score stops improving after two iterations

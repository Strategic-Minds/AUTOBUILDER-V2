# AssetGrid Validation, Repair, and Hardening Specification v1

Status: PREVIEW/DRAFT
Owners: AssetGrid QA Recursive Repair Agent; AssetGrid Security Hardening Agent; AssetGrid Receipt Auditor

## Purpose
Define deterministic evidence gates. No implementation agent may self-certify completion.

## Validation families
### Code
clean checkout, dependency install, lockfile integrity, lint, typecheck, unit, integration, API, contract, build, dependency audit, secret scan.

### Data/authorization
schema inventory, migration draft, rollback draft, RLS inventory, anonymous denial, unauthenticated denial, cross-user denial, wrong-owner denial, correct-owner success, service-role isolation, idempotency, concurrency, queue claim, lease recovery, dead-letter.

### Browser E2E
Desktop/tablet/mobile golden paths across auth, search, filters, categories, item details/previews, favorites, collections, workspaces, cart, checkout test-double, licenses/downloads, seller onboarding/upload/portfolio, admin/moderation, AI tool flows. Capture screenshots, console errors, failed requests, broken links, layout overflow, JS exceptions.

### Accessibility
WCAG 2.2 AA, keyboard, focus order, labels, semantics, screen-reader announcements, contrast, reduced motion, touch targets.

### Security/abuse
Authentication, authorization, RLS, IDOR, CSRF, XSS, SQL/NoSQL injection, SSRF, command injection, path traversal, prototype pollution, malicious upload, MIME spoofing, archive/ZIP abuse, webhook replay, privilege escalation, rate limiting, secret exposure, dependency/supply-chain risk, tool/connector allowlists, prompt/tool injection.

### Performance/recovery
critical route budgets, API latency, DB query budgets, bundle size, image loading, caching, queue throughput, concurrent claims, graceful degradation, backup, restore, rollback, incident recovery, observability.

### Connector/tool
For each required connector: capability inventory, authentication state, least-privilege scope, happy path, denied path, transient failure, retry behavior, audit receipt.

## Status vocabulary
Only: PASS, PASS WITH WARNINGS, FAIL, BLOCKED, NOT TESTED.

## Repair contract
FAIL -> immutable failure receipt -> root-cause classification -> smallest responsible packet -> isolated branch/sandbox repair -> exact failed test -> affected regression suite -> independent validator -> PASS or requeue.

Rules: never weaken assertions to get green; never delete a failing test solely to make validation pass; do not retry deterministic failures without a changed hypothesis/artifact.

## Hardening contract
Functional PASS triggers security/reliability review. HIGH/CRITICAL findings become HardeningQueue records and block release eligibility. Re-run the affected security suite and one broader regression after each hardening change.

## Three-pass rule for release candidate
For immutable release-candidate identity, require three consecutive clean runs of the mandatory validation mesh where practical. Any artifact-changing repair resets the clean-pass counter.

## 100% definition
100% means all defined critical requirements have implementation evidence; all applicable mandatory gates PASS; zero failed/blocked critical validations with available safe workarounds; zero unresolved HIGH/CRITICAL defects; zero missing critical receipts/rollback references; 100% critical route/workflow/tool coverage. It never means absence of unknown future defects.

## Receipts
Every validation receipt: project, requirement ID, artifact identity/hash/commit, validator, environment, test command/tool, result, timestamp, evidence URL/ref, defect IDs, repair IDs, rollback ref.

## Rollback
Validation artifacts are append-only evidence. Repairs revert by branch commit/revert; data changes require explicit rollback plan before execution.
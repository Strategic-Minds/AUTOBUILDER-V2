# AssetGrid Requirement Traceability Matrix v1

Status: DRAFT / DISCOVERY-DOCS HANDOFF
Owner: AssetGrid Receipt Auditor
Project: `assetgrid-clone-factory`

## Rule
A critical requirement may close only when implementation evidence, independent validation evidence, receipt, and rollback reference exist.

| Requirement | Purpose | Depends on | Required validation | Current |
|---|---|---|---|---|
| AG-RIGHTS-001 | clean-room source boundary | operator authorization | rights/source audit | ACTIVE |
| AG-DISC-002 | target public capability map | AG-RIGHTS-001 | source evidence review | ACTIVE |
| AG-REQ-FE-001 | frontend graph | AG-DISC-002 | completeness review | ON_DECK |
| AG-REQ-BE-001 | backend graph | AG-DISC-002 | completeness review | ON_DECK |
| AG-REQ-COM-001 | commerce/license graph | AG-DISC-002 | contract review | ON_DECK |
| AG-REQ-AUTHOR-001 | author graph | AG-DISC-002 | contract review | ON_DECK |
| AG-REQ-ADMIN-001 | admin/moderation graph | AG-DISC-002 | security review | ON_DECK |
| AG-REQ-AI-001 | AI graph | AG-DISC-002 | provider/safety review | ON_DECK |
| AG-OPS-001 | five-minute autonomy contract | queue + auth + runtime | lease/idempotency/receipt tests | ON_DECK |
| AG-VAL-001 | validation mesh | all requirement specs | validator review | ON_DECK |
| AG-SEC-001 | security hardening spec | backend/ops specs | security review | ON_DECK |
| AG-AUDIT-001 | receipt traceability | all | receipt coverage | ON_DECK |
| AG-FE-001 | buyer account | FE spec + BE identity | E2E/a11y/security | ON_DECK |
| AG-FE-002 | catalog discovery | search backend | E2E/a11y/API | ON_DECK |
| AG-FE-003 | item/previews | catalog/file backend | E2E/visual/media | ON_DECK |
| AG-FE-004 | community/support | community backend | E2E/auth/moderation | ON_DECK |
| AG-FE-005 | favorites/workspaces | ownership/RLS | E2E/data isolation | ON_DECK |
| AG-FE-006 | cart/checkout | commerce backend | E2E/contract/idempotency | ON_DECK |
| AG-FE-007 | downloads/licenses | entitlement backend | E2E/authz/security | ON_DECK |
| AG-FE-008 | subscription/AI | subscription + AI backend | quota/billing-test-double E2E | ON_DECK |
| AG-FE-009 | author portal | author/compliance backend | E2E/RBAC/a11y | ON_DECK |
| AG-FE-010 | admin operations | admin/moderation backend | RBAC/audit/security | ON_DECK |
| AG-FE-011 | responsive/accessibility | all critical FE | WCAG/browser | ON_DECK |
| AG-BE-001 | identity/RBAC/RLS | schema/auth design | data authorization suite | ON_DECK |
| AG-BE-002 | catalog model | requirement graph | schema/migration/rollback | ON_DECK |
| AG-BE-003 | search/recommendations | catalog/events | API/ranking fixtures | ON_DECK |
| AG-BE-004 | asset pipeline | storage/file design | malicious-file/security | ON_DECK |
| AG-BE-005 | commerce | entitlement/payment abstraction | contract/webhook/idempotency | ON_DECK |
| AG-BE-006 | subscriptions | commerce/usage | state/quota/concurrency | ON_DECK |
| AG-BE-007 | license/download | entitlement + file delivery | authz/revocation/signed URL | ON_DECK |
| AG-BE-008 | author earnings/compliance | identity/commerce | RBAC/ledger integrity | ON_DECK |
| AG-BE-009 | community/support | identity/catalog | eligibility/moderation | ON_DECK |
| AG-BE-010 | moderation/legal/abuse | identity/audit | RBAC/security/audit | ON_DECK |
| AG-BE-011 | event analytics | domain events | privacy/integrity | ON_DECK |
| AG-BE-012 | queue runtime | durable DB/runtime | lease/retry/dead-letter | ON_DECK |
| AG-BE-013 | observability/recovery | runtime/storage | health/backup/restore | ON_DECK |
| AG-AI-001 | AI backend | identity/usage/provider router | safety/quota/fallback | ON_DECK |
| AG-VAL-101 | code quality | implementation | build/lint/types/tests | ON_DECK |
| AG-VAL-102 | data auth | schema/RLS | denial/concurrency/rollback | ON_DECK |
| AG-VAL-103 | browser E2E | preview | Playwright golden paths | ON_DECK |
| AG-VAL-104 | visual/a11y | preview + brand contract | screenshots/WCAG | ON_DECK |
| AG-VAL-105 | security/abuse | preview/backend | security mesh | ON_DECK |
| AG-VAL-106 | performance/recovery | preview/runtime | budgets/backup/restore | ON_DECK |
| AG-VAL-107 | connectors/tools | authenticated connectors | capability/failure tests | ON_DECK |
| AG-REPAIR-001 | recursive repair | failed validations | same-test + regression | ON_DECK |
| AG-HARDEN-001 | continuous hardening | functional pass | security/reliability recheck | ON_DECK |

## Phase exit criteria
### Discovery exit
AG-RIGHTS-001 boundary recorded; AG-DISC-002 capability map complete; top-level FE/BE/commerce/author/admin/AI requirements have acceptance criteria and dependencies; executable-validation path/blocker documented.

### Docs exit
Frontend/backend/workflow/cron/AI/Supabase/agent/validation/rollback/env docs exist on isolated branch and are linked by Base44 receipts.

### Preview build exit
Critical preview features implemented with no unresolved build blockers and protected production actions still locked.

### Preview validated
All applicable critical validation gates PASS; no unresolved HIGH/CRITICAL; receipt/rollback coverage complete.

## Rollback
Revert branch docs or discard branch. Base44 canonical state remains independently recoverable from receipts/checkpoint.
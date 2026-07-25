# Strategic Minds Cross-Platform Forensic Discovery Receipt

- **Receipt ID:** DISCOVERY-20260725-001
- **Timestamp:** 2026-07-25T23:25:14Z
- **Phase:** DISCOVERY
- **Mode:** Branch-safe read audit plus documentation write
- **Branch:** `auto-builder/forensic-discovery-20260725`
- **Production mutation:** None
- **Database mutation:** None
- **Secret values accessed or recorded:** None
- **Release decision:** BLOCKED pending security remediation and full validation

## Scope completed in this receipt

1. Confirmed GitHub administrative access to the `Strategic-Minds` organization.
2. Confirmed Google Drive access and enumerated seven shared drives, including `AUTO BUILDER OS`, `STRATEGIC MINDS AI LLC`, `XTREME BUILDER`, `VAULT`, and `ARCHIEVE`.
3. Confirmed the AUTO BUILDER 2 MCP control plane is healthy as `xps-ai-factory-control-plane` on Vercel.
4. Located the current Drive document `XAB Canonical Pipeline - Source of Truth`, version 2026-07-23.
5. Verified the document names `Strategic-Minds/AUTOBUILDER-V2` as repository authority, `Strategic-Minds/XAB` as the XAB implementation repository, and `xai_projects` as the pipeline project table.
6. Verified Vercel projects `autobuilder-v2` and `xab-system` and inspected recent `xab-system` deployments.
7. Verified the latest inspected XAB preview health endpoint returns HTTP 200 and reports database and BrowserWorker checks healthy.
8. Inspected Supabase migrations, table metadata, Edge Functions, and security advisors without changing the database.
9. Inspected the XAB pipeline creation, webhook, approval, deployment, and Supabase client code paths.

## Authority map

| Layer | Current evidence-backed authority | Status |
|---|---|---|
| Human-readable pipeline source truth | Drive: `XAB Canonical Pipeline - Source of Truth`, version 2026-07-23 | Current candidate |
| Governance repository | `Strategic-Minds/AUTOBUILDER-V2` | Verified repository authority |
| Runtime implementation repository | `Strategic-Minds/XAB` | Verified active implementation |
| Vercel runtime | `xab-system` | Build and health endpoint active |
| Governance/legacy preview | `autobuilder-v2` | Active preview project; not marked live |
| Supabase project | `azajysheebfhyzoyplpf` / `supabase-blue-zebra` | Active healthy project |
| Pipeline project table | `public.xai_projects` | Present, but security-blocked |
| Receipt surface | `public.xai_receipt_log` | Present with RLS and one policy |
| MCP control plane | `xps-ai-factory-control-plane` | Health check passed |

## Verified implementation capabilities

The XAB repository currently contains or declares:

- Next.js 15 and React 19 application runtime
- Supabase SSR and JavaScript clients
- Vercel AI SDK and OpenAI provider integration
- MCP SDK integration
- PWA support
- OpenTelemetry and Sentry dependencies
- Playwright, Vitest, lint, type-check, accessibility, scaffold, MCP, security, and dependency-audit scripts
- Pipeline routes for parse, project creation, image generation, approval, deployment, status, and public webhook ingestion
- Vercel linkage to `xab-system`
- Recent branch-safe preview deployments

## Critical security findings

### F-001: Public pipeline ingestion can trigger state-changing work

`/api/pipeline/webhook` accepts POST requests without an authenticated principal or signed webhook verification. The only observed control is an in-memory IP counter. The route parses commands, creates a project record, and starts image generation.

**Severity:** Critical

### F-002: Public project creation uses anon Supabase access against a table with RLS disabled

`/api/pipeline/create` uses the server Supabase client configured with the public anon key and inserts into `public.xai_projects`. Database metadata confirms `xai_projects` has RLS disabled and zero policies.

**Severity:** Critical

### F-003: Approval is a state-changing GET request without a signed approval token

`/api/pipeline/approve` accepts `project_id` and `action` query parameters. The approve action updates project state and triggers deployment. No authenticated user check, nonce, signature, expiry, or one-time approval token was observed in the inspected route.

**Severity:** Critical

### F-004: Deployment route can provision external resources without route-level authorization

`/api/pipeline/deploy` can create a GitHub repository, create a Vercel project, create a Google Drive folder, update Supabase, and trigger a site build. No route-level authenticated operator check was observed. The GitHub repository creation payload also sets `private: false`, conflicting with the canonical requirement for a private Strategic-Minds repository.

**Severity:** Critical

### F-005: Supabase security posture is not production-ready

Read-only database inspection found:

- **299** public-schema tables
- **144** tables with RLS enabled
- **155** tables with RLS disabled
- **45** tables with RLS enabled but no policy
- **99** tables with one or more policies

Supabase advisors additionally report:

- Public exposed tables without RLS, including `xai_projects`
- Sensitive session identifier columns exposed on tables without RLS
- Overly permissive `USING (true)` or `WITH CHECK (true)` policies
- Publicly executable `SECURITY DEFINER` functions
- Mutable function search paths
- A public storage bucket allowing broad object listing
- Leaked-password protection disabled

**Severity:** Critical

### F-006: Queue and receipt tables can be locked out rather than safely governed

`xai_factory_jobs` and `xai_factory_receipts` have RLS enabled but zero policies. This can block normal anon/authenticated operations while service-role paths bypass RLS, creating inconsistent and difficult-to-audit behavior.

**Severity:** High

### F-007: Documentation and implementation state conflict

The XAB README labels the system as discovery phase with implementation pending approval, while the repository contains pipeline routes and Vercel has deployed them. The governance repository also states that several adapters remain stubs and live-environment Playwright validation is incomplete.

**Severity:** High governance drift

### F-008: Deployment history shows build churn before READY state

The `xab-system` deployment history includes numerous failed builds followed by a READY production deployment and READY previews. One inspected failure was caused by a missing `./styles.css` import in `app/national-epoxy-pros/page.tsx`.

**Severity:** Medium reliability risk

## Positive evidence

- MCP health check passed.
- Current XAB preview health endpoint returned HTTP 200.
- Health checks reported database and BrowserWorker connectivity healthy.
- The governance repository documents branch/sandbox/draft/preview defaults and explicit production gates.
- XAB includes a broad automated validation script surface.
- The latest inspected preview deployment was built from a branch-safe pull request branch.
- A dedicated receipt table exists with governance-oriented fields.

## Decision

**Do not proceed to autonomous system construction or production consolidation from the current shared Supabase project.**

The estate contains substantial reusable intellectual property, but the current data plane and provisioning routes violate the minimum release gate for authenticated approval, tenant isolation, least privilege, and safe external provisioning.

The correct next phase is a branch-safe **Security Containment and Authority Reconciliation Packet**, not a commercial build.

## Required remediation order

1. Disable or protect unauthenticated access to state-changing pipeline routes.
2. Replace GET-based approvals with signed, expiring, one-time POST approval tokens tied to an operator identity.
3. Add a centralized authorization guard for provisioning actions.
4. Make GitHub repository visibility policy explicit and fail closed.
5. Design and validate tenant/operator RLS for `xai_projects`, queue, receipt, approval, connector, and provisioning tables.
6. Revoke unintended anon/authenticated execution on `SECURITY DEFINER` functions.
7. Set immutable function `search_path` values.
8. Review public storage listing policy.
9. Enable leaked-password protection where supported by the plan.
10. Create negative access tests for anon, authenticated non-owner, operator, service role, and cross-tenant access.
11. Run Playwright and API security tests against preview only.
12. Reconcile README, Drive canonical document, Vercel projects, and actual code state.
13. Only after the security gate passes, resume commercial capability scoring and preview-system selection.

## Rollback

This receipt is the only write created by this discovery tranche. Rollback is deletion of this file and deletion of branch `auto-builder/forensic-discovery-20260725`. No production resource or database object was changed.

## VERIFIED

- The named repositories and Vercel projects exist and are accessible.
- The XAB preview health endpoint responded successfully.
- The listed source files contain the described routes and behavior.
- The Supabase counts came from read-only system catalog queries.
- The security findings were returned by Supabase advisors or directly verified in code.

## INFERRED

- The shared Supabase project has accumulated multiple generations of schemas and product experiments.
- The highest-value consolidation path is likely a modular platform rather than a raw super-repository.
- The current health score measures dependency availability, not tenant security or complete end-to-end safety.

## COULD NOT VERIFY

- Complete inventory and health of every Strategic-Minds repository and Vercel project.
- Whether every state-changing route is additionally protected by Vercel deployment protection or upstream middleware.
- Whether production tokens currently have restricted scopes.
- Whether all Drive packets are subordinate to the July 23 canonical document.
- Full Playwright, mobile, PWA, visual parity, and negative-access evidence for the current deployment.

## BLOCKERS

- Critical Supabase RLS and API exposure findings.
- Unauthenticated approval and provisioning routes.
- Conflicting documentation and runtime state.
- Incomplete full-estate provenance and duplication map.

## WORKAROUNDS

- Continue all remediation and validation on a Git branch and Vercel preview.
- Draft SQL migrations without applying them to production.
- Use mocked or isolated preview data for negative-access testing.
- Preserve current production deployment while preventing further autonomous provisioning until authorization controls pass.

## NEXT ACTIONS

- Produce branch-safe security remediation specifications and migration drafts.
- Map all AUTO BUILDER and XAB duplicate repositories against the canonical authority chain.
- Complete Vercel project-to-repository mapping and runtime health classification.
- Complete Drive source-truth conflict analysis.
- Re-run Supabase advisors after preview-only remediation is prepared and tested.

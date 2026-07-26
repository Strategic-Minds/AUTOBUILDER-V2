# Xtreme AI Builder Donor Matrix

## Import rules

A donor component is accepted only when it is implemented, non-duplicative, compatible with the canonical `xab_v3_*` data plane, covered by evidence, production locked, and registered in `MIGRATION_MANIFEST.json`. Whole-repository merges are prohibited.

| Capability | Primary donor | Secondary evidence | Canonical destination | Decision |
|---|---|---|---|---|
| Operator UI and workflow APIs | `Strategic-Minds/AUTOBUILDER-V2` | PR #31 preview | existing root application, later `apps/web` | KEEP |
| Pipeline state machine | `XTREME-AI-SYSTEMS/factory-control-plane` | deployed commits and tests | `packages/core/pipeline-state` | HARVEST |
| Release evaluator | `XTREME-AI-SYSTEMS/factory-control-plane` | 99% visual and 100% operational gates | `packages/governance/release-gate` | HARVEST |
| Planner and dependency graph | `XTREME-AI-SYSTEMS/factory-runtime` | runtime tests and READY deployment | `packages/core/planner` | HARVEST |
| Repair policy | control-plane and factory-runtime | five-cycle ceiling | `packages/validation/repair-policy` | HARVEST |
| MCP and provisioning | `Strategic-Minds/AUTO_BUILDER-V1` | real provider code | `packages/connectors` | HARVEST_REAL_ADAPTERS |
| Browser execution | `Strategic-Minds/BROWSERWORKER` | managed Chromium and SSRF controls | `apps/browserworker` plus `packages/connectors/browserworker` | HARVEST |
| Request guards | `Strategic-Minds/CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | 83/83 donor tests | `packages/governance/http-guards` | HARVEST_PURE_LOGIC |
| Queue leases and recovery | `CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | donor repository and migrations | canonical migration/RPC design using `xab_v3_workflow_jobs` | ADAPT_NOT_COPY_SCHEMA |
| Brand-pack contract | `CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | immutable approval and checksum logic | `packages/project-contracts/brand-pack` | HARVEST_PURE_LOGIC |
| Web-pack contract | `CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | route, state and viewport inventory | `packages/project-contracts/web-pack` | HARVEST_PURE_LOGIC |
| Intake normalization | `Strategic-Minds/WEBSITE-FACTORY` | build-packet API | `packages/project-contracts/intake` | HARVEST |
| Website output standard | `Strategic-Minds/WEBSITE-SYSTEM-TEMPLATE` | full desktop/mobile/PWA requirement | `packages/templates/website-contract` | HARVEST |
| Persona QA | `Strategic-Minds/sm-qa-agent` | mobile/desktop personas | `packages/validation/personas` | HARVEST_PATTERNS |
| Scoring taxonomy | `strategic-minds-test-suite` | persisted 19-category score model | `packages/validation/scorecard` | HARVEST_PATTERNS |
| PWA runtime | current canonical repo | manifest, service worker, icons | root app, later `apps/web` | KEEP_AND_REPAIR |
| Database | canonical `xab_v3_*` tables | PR #31 data layer | `supabase/` | KEEP_ONLY |

## Explicit rejections

- `uasf_*` tables from the autonomous-system-factory donor
- another `factory_*`, `autonomous_builds_*`, or `new_builder_*` table family
- `manual_receipt` as a successful final-build executor
- documentation-only adapters
- fake queue acceptance without a durable worker owner
- production authorization embedded in runtime code
- wholesale import of customer or independent product repositories

## Import order

1. Stabilize canonical build and browser CI.
2. Freeze census, authority map, migration manifest and deprecation plan.
3. Add pure project contracts and release policies.
4. Adapt queue leases and atomic claims to `xab_v3_workflow_jobs` through forward and rollback SQL.
5. Install real MCP and BrowserWorker adapters.
6. Prove brand approval, website approval, final build and preview monitoring.
7. Execute the isolated golden path.
8. Retire duplicate platform sources only after approval.

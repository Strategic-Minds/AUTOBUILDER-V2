# Xtreme AI Builder Deprecation Plan

## Rule

No repository is deleted or archived during this preview-only execution. The plan becomes actionable only after the canonical golden path passes, rollback is proven, and the operator approves the final release bundle.

## Canonical banner

Duplicate platform repositories will eventually receive:

> **SUPERSEDED BY:** `Strategic-Minds/AUTOBUILDER-V2`

The banner must include the source commit harvested, destination path, tests, remaining independent purpose, rollback instructions, and archive approval reference.

## Phase 1: Evidence and containment

- Keep PR #31 as the single consolidation lane.
- Stop creating new builder, factory, control-plane, runtime, parity, template, or golden-path repositories.
- Keep existing Vercel projects intact as rollback targets.
- Record repository and deployment associations.
- Preserve independent products.

## Phase 2: Selective harvest

| Repository | Required harvest | Retirement state after harvest |
|---|---|---|
| `XTREME-AI-SYSTEMS/factory-control-plane` | state machine, release gates, migrations and tests | archive candidate |
| `XTREME-AI-SYSTEMS/factory-runtime` | planner, dependency graph, sandbox and repair contracts | archive candidate |
| `XTREME-AI-SYSTEMS/browserworker` | compare unique contracts with primary BrowserWorker | archive candidate if fully duplicated |
| `XTREME-AI-SYSTEMS/parity-engine` | unique parity formulas only | archive candidate |
| `XTREME-AI-SYSTEMS/template-registry` | immutable packet contract only | archive candidate |
| `XTREME-AI-SYSTEMS/platform-config` | validated environment-name inventory only | archive candidate |
| `XTREME-AI-SYSTEMS/golden-path` | unique proof fixture only | archive candidate |
| `Strategic-Minds/AUTO_BUILDER-V1` | real MCP and provider adapters | legacy donor; archive only after adapter parity |
| `Strategic-Minds/CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | guards, contracts, queue and receipt algorithms | archive candidate after pure-logic harvest; reject `uasf_*` schema |
| `Strategic-Minds/XAB` | unique governance or source-truth records | archive candidate |
| `Strategic-Minds/xtreme-ai-builder` | unique UI, PWA, accessibility and observability code | archive candidate after parity |
| `Strategic-Minds/auto-builder-os` | unique operator UI components only | archive candidate |
| `Strategic-Minds/v0-auto-builder-v2` | unique advanced adapters only | archive candidate |
| `Strategic-Minds/AUTOBUILDER-2.0` | unique v0 interface patterns only | archive candidate |
| `Strategic-Minds/gpt-automation-pipeline` | unique control contracts only | archive candidate |
| `Strategic-Minds/APP-FACTORY` | unique generic application contracts only | archive candidate or independent product |

## Phase 3: Deploy-target consolidation

Existing Vercel projects may remain separate deploy targets while sourcing from one repository:

- `autobuilder-v2`
- `factory-control-plane`
- `factory-runtime`
- `browserworker`

For each target:

1. Add a canonical monorepo root directory.
2. Create a preview deployment.
3. Compare routes and contracts against the prior deployment.
4. Run browser and API tests.
5. Preserve the prior deployment as rollback.
6. Repoint production only in the final approved release.

## Phase 4: Golden path

Retirement is blocked until one isolated project proves:

- three brand packs
- immutable test approval
- three complete website packs
- immutable test approval
- real output repository and implementation branch
- pull request
- reachable preview
- BrowserWorker evidence
- desktop, tablet, mobile and PWA validation
- controlled repair cycle
- visual, structural and operational gates
- rollback evidence
- production remains locked

## Phase 5: Operator-approved retirement

The final approval bundle must list every repository individually. Archive actions are reversible. Deletion is not proposed.

Required approval phrase:

`APPROVE FINAL XTREME AI BUILDER CONSOLIDATION RELEASE`

## Independent products excluded from retirement

Scrapers, takeoff and estimating products, bid systems, CRM, lead intelligence, social systems, Eden Skye Studios, visualization products, contractor portals, XPS websites, National Epoxy sites, and generated customer projects remain separate unless an independent product-specific decision says otherwise.

## Rollback

Before any archive or Vercel-root repoint:

- record the prior repository and deployment URL
- preserve the previous default branch SHA
- preserve environment-variable names without exposing values
- keep the prior Vercel deployment available
- document the command or connector action required to restore the prior root
- verify database changes have forward and rollback pairs

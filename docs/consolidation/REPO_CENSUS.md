# Xtreme AI Builder Repository Census

**Canonical platform:** `Strategic-Minds/AUTOBUILDER-V2`  
**Branch:** `auto-builder/forensic-consolidation-20260725`  
**Pull request:** `#31`  
**Production:** locked

## Discovery boundary

The census covers every repository exposed by the connected GitHub installations for `Strategic-Minds`, `XTREME-AI-SYSTEMS`, `XPS-IINTELLIGENCE-SYSTEMS`, and `xps-admin`. `REPO_CENSUS.json` contains the durable name inventory. A repository name, README, size, or recent modification is not treated as implementation proof. Runtime deployments, code, tests, migrations, pull requests, and connector evidence outrank labels.

## Canonical decision

`Strategic-Minds/AUTOBUILDER-V2` is the sole surviving Xtreme AI Builder platform repository. It already owns PR #31, the `/factory` operator surface, the `xab_v3_*` workflow data plane, the five-minute worker, production lock, and the active Vercel preview project.

## Core donors

| Repository | Evidence-backed value | Import boundary |
|---|---|---|
| `XTREME-AI-SYSTEMS/factory-control-plane` | State transitions, five-cycle repair ceiling, fail-closed release evaluator, isolated migrations and rollback tests | Pure control logic only |
| `XTREME-AI-SYSTEMS/factory-runtime` | Dependency graph, planner, validation ordering, sandbox policy and repair contracts | Runtime algorithms only |
| `Strategic-Minds/AUTO_BUILDER-V1` | MCP, Drive, Vercel, provisioning and browser connectors | Real adapters only; reject `manual_receipt` as final execution |
| `Strategic-Minds/BROWSERWORKER` | Authenticated managed Chromium, SSRF protection, screenshots, console and network capture | Preserve separate deploy target while moving source under canonical ownership |
| `Strategic-Minds/CHATGPT-AUTONOMOUS-SYSTEM-FACTORY` | Request guards, queue leases, recovery, immutable receipts, connector allowlists and pack contracts | Do not import its parallel `uasf_*` schema |
| `Strategic-Minds/WEBSITE-FACTORY` | Intake normalization and build packets | Normalize into canonical project contracts |
| `Strategic-Minds/WEBSITE-SYSTEM-TEMPLATE` | Full desktop, tablet, mobile, PWA, funnel, preview and parity standard | Binding output contract |
| `Strategic-Minds/sm-qa-agent` and `strategic-minds-test-suite` | Persona tests and scoring taxonomy | Validation package patterns |

## Selective donors

`XAB`, `xtreme-ai-builder`, `auto-builder-os`, `v0-auto-builder-v2`, `AUTOBUILDER-2.0`, `ADMIN-COMMAND`, `MASTER-TEMPLATE-SYSTEM`, `gpt-automation-pipeline`, `APP-FACTORY`, `xps-website-factory`, `parity-engine`, `template-registry`, `platform-config`, and `golden-path` may contribute unique verified components. They may not become competing sources of truth.

## Independent products

Scrapers, takeoff systems, bid systems, lead intelligence, CRM, social systems, Eden Skye Studios, visualization tools, contractor portals, National Epoxy properties, XPS websites, and customer websites remain independent deliverables. The canonical builder may call them through adapters but must not absorb their complete product logic.

## Empty, duplicate and legacy handling

No repository is deleted or archived during preview consolidation. Empty placeholders, clone repositories, v0 shells, retired micro-repositories, and duplicate builders receive a `SUPERSEDED BY Strategic-Minds/AUTOBUILDER-V2` plan only after:

1. Unique components are harvested with source commit provenance.
2. Canonical tests pass.
3. Existing deploy targets build from canonical source.
4. The golden path passes.
5. Rollback evidence exists.
6. The operator approves retirement.

## Current verified findings

- PR #31 remains open, draft, mergeable, and production locked.
- Dependency lock drift was repaired on the consolidation branch.
- Master validation reached PASS after lockfile synchronization.
- Browser CI now executes against a verified preview alias rather than an empty or production URL.
- A stale validation assertion was corrected to match the deployed `/api/validation` contract.
- Desktop, tablet, mobile, factory-route and PWA checks are installed in the browser suite.
- The PWA manifest and service-worker route mismatch was repaired.
- Base44 contains stale project records and a conflicting older production-default decision. The current operator directive overrides that decision and keeps production locked.
- The latest Drive hardening receipt identifies useful donor logic but confirms that the native final-build adapter and persistent golden path are still incomplete.

## Honesty boundary

Core repositories were inspected beyond metadata. The remaining long-tail inventory is recorded but defaults to `COULD_NOT_VERIFY`, `INDEPENDENT_PRODUCT`, `LEGACY_DUPLICATE`, or `ARCHIVE_CANDIDATE` until direct code or runtime evidence justifies a stronger classification.

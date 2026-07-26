# AUTO BUILDER Repository Forensic Audit

Date: 2026-07-25
Branch: `auto-builder/forensic-consolidation-20260725`
Production status: LOCKED

## Objective

Identify the strongest implementation assets across the user's AUTO BUILDER repositories and consolidate them into one governed, branch-safe primary repository capable of supporting a ChatGPT-driven autonomous application-building pipeline.

## Canonical destination

`Strategic-Minds/AUTOBUILDER-V2`

Rationale:

- Existing Next.js 15 and React 19 application
- Supabase integration
- Vitest and Playwright support
- Existing API routes, cron scaffolds, registries, skills, documentation, CI, scorecard, and critical-journey tests
- Existing README explicitly designates this repository as the governance brain and receipt surface
- Active and not archived

## Audited repositories

### Strategic-Minds/AUTOBUILDER-V2

Role: canonical destination and product runtime.

Keep:

- Next.js application foundation
- project and admin routes
- Supabase integration
- registry model
- agent Skills
- scorecard and e2e structure
- preview-first safety model

Known gaps:

- several factory adapters remain stubs
- live queue and lease behavior not fully proven
- live BrowserWorker integration not proven
- full live deployment e2e not proven

### Strategic-Minds/XAB

Role: enterprise validation and observability donor.

Promote selectively:

- stronger validation scripts
- MCP validation
- security validation
- accessibility validation
- OpenTelemetry
- Sentry
- structured logging
- PWA support
- stronger test and audit scripts

Do not replace the destination wholesale. Import capability modules only after dependency and route review.

### Strategic-Minds/AUTO_BUILDER-V1

Role: bridge, MCP, connector, workflow, queue, receipt, governance, and historical implementation donor.

Promote selectively:

- GPT bridge
- MCP universe and provider registry
- queue runner
- factory registry
- runtime contracts
- cron authentication
- workflow control logic
- Vercel Sandbox support
- workbook and build-packet patterns
- validation scripts
- Supabase factory schema concepts

Risks:

- large volume of overlapping historical documentation
- repeated bridge smoke-test commits are not full pipeline proof
- dependency version conflicts
- some scaffolds and plans may be stale

### Strategic-Minds/auto-builder-os

Role: premium UI and operator control-plane donor.

Promote selectively:

- command-center interface
- navigation and project workflows
- approval UX
- queue, validation, repair, and release views
- modern Next.js 16 UI patterns after compatibility review

Risks:

- Next.js 16 and AI SDK 7 differ from the destination stack
- minimal validation scripts in package configuration
- earlier cron handler defects must not be copied

### Strategic-Minds/v0-auto-builder-v2

Role: advanced runtime adapter and orchestration donor.

Promote selectively:

- BullMQ and Redis queue patterns
- GitHub Octokit integration
- Groq and OpenAI multi-provider routing
- Prisma and PostgreSQL patterns where justified
- Socket.IO event transport
- Playwright and Puppeteer automation
- Figma integration
- authentication utility patterns

Risks:

- broad dependency surface
- potential duplication of Supabase-native queue/state design
- Next.js 16 compatibility differences
- high coupling risk

### Strategic-Minds/BROWSERWORKER

Role: independent browser validation service.

Keep independent. Do not merge it into the main runtime.

Integrate through a versioned adapter contract that accepts:

- preview URL
- reference assets
- viewport matrix
- functional acceptance matrix
- visual thresholds

And returns:

- screenshots
- console errors
- network errors
- interaction results
- visual comparison evidence
- validation receipts

### Strategic-Minds/FULL-AUTO

Role: excluded pending evidence.

Reason: repository size is too small to justify canonical or donor status without additional implementation evidence.

### XPS-IINTELLIGENCE-SYSTEMS/XPS_AUTO_BUILDER

Role: vertical-specific reference only.

Reason: retain useful XPS-specific workflows or templates, but do not let a vertical implementation define the universal factory core.

## Recommended target architecture

- `AUTOBUILDER-V2`: control plane, source truth, orchestration, queue contracts, memory contracts, project factory, release controller
- `BROWSERWORKER`: independent browser and parity validator
- Supabase: durable project state, queues, leases, attempts, receipts, memory, approvals, defects, release candidates
- Vercel Workflow and cron: durable orchestration and five-minute watchdog
- ChatGPT Skills and MCP: governed operator interface and tool routing
- GitHub branches and draft pull requests: implementation boundary

## Consolidation rules

1. No blind repository merge.
2. Every imported component receives a donor source, version, commit SHA, destination path, tests, rollback path, and acceptance gate.
3. `main` remains untouched until draft-PR review and validation.
4. Production remains locked.
5. BrowserWorker remains independent.
6. Existing Supabase production schemas remain untouched until a reviewed migration and rollback are approved.
7. The V6 workbook remains the controlling specification.

## Initial ranking

1. `AUTOBUILDER-V2` - best destination and governance spine
2. `XAB` - best enterprise validation, observability, PWA, and security donor
3. `AUTO_BUILDER-V1` - best bridge, MCP, queue, workflow, receipt, and historical runtime donor
4. `v0-auto-builder-v2` - richest advanced runtime dependency and adapter donor
5. `auto-builder-os` - best UI and operator-console donor
6. `BROWSERWORKER` - mandatory independent validator

## Release gate

No claim of autonomous factory completion until one real project proves:

1. approved visual input
2. project instantiation
3. workbook registration
4. queue execution
5. generated application
6. GitHub branch commits
7. Vercel preview
8. BrowserWorker desktop, tablet, and mobile evidence
9. functional acceptance tests
10. bounded repair
11. rollback evidence
12. receipt chain
13. final state `AWAITING_PRODUCTION_APPROVAL`

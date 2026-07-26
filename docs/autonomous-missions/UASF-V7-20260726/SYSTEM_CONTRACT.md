# Xtreme AI Builder System Contract

Mission: `UASF-V7-20260726-001`

## Purpose

Create a universal, project-neutral reliability control plane that detects source-truth drift, validates Preview systems, classifies failures, prescribes bounded repairs, records evidence, and refuses release when proof is incomplete.

## Architecture

### 1. Source truth verification

Inputs:

- V7 workbook name, hash, and control copy
- Google Drive mission folder and artifacts
- GitHub repository, branch, commit, and pull request
- Vercel project, deployment, source branch, and source commit
- Supabase project and security findings
- Xtreme AI Builder job and receipt identifiers
- BrowserWorker validation receipts

Responsibilities:

- Detect missing or contradictory identifiers
- Detect workbook checksum drift
- Detect branch/deployment commit mismatch
- Detect completion claims without receipts
- Keep Production locked when evidence is missing

### 2. BrowserWorker validation

Planned evidence contract:

- Desktop, tablet, and mobile viewport results
- Route and navigation traversal
- Button, CTA, and form interaction tests
- Console and network errors
- Accessibility landmarks and keyboard checks
- Full-page screenshots
- PWA and service-worker checks when applicable
- Runtime and deployment correlation

BrowserWorker has evidence authority only. It does not receive repository-write, database-migration, secret, merge, or Production authority.

### 3. Recursive testing and repair

Implemented core stages:

`AUDIT → AUTO_FIX → AUTO_HEAL → AUTO_HARDEN → AUTO_TEST → AUTO_OPTIMIZE → AUTO_RETEST → AUTO_REOPTIMIZE → FULL_REGRESSION → SCORE → DECIDE`

The current deterministic engine:

- classifies failure domains
- weighs critical, high, medium, and low severity
- distinguishes undetected, unrepaired, regression-failed, and resolved states
- produces smallest-layer repair directives
- deducts evidence score for unresolved faults
- returns `PREVIEW_ACCEPTABLE` only when score is at least 95 and no blocking defect remains

## Routes

- `GET /api/resilience/status`: current mission, source truth, modules, connector states, and blockers
- `POST /api/resilience/status`: validate a bounded fault set and produce a recursive-cycle decision receipt
- `GET /resilience`: operator command center and controlled-fault demonstration

## Security boundaries

- Preview-only implementation
- No secrets in source control
- No legacy Supabase mutation
- No default-branch merge
- No Production deployment or alias promotion
- No customer or public messaging
- No destructive action
- No paid resource creation

## Acceptance criteria

### Code gate

- release validation passes
- TypeScript passes
- unit tests pass
- Next.js build passes
- no critical dependency audit failure

### API gate

- GET status returns HTTP 200 and `productionLocked: true`
- invalid JSON returns HTTP 400
- invalid fault payload returns HTTP 400
- unresolved critical fault returns `REPAIR_REQUIRED`
- fully repaired fault set returns `PREVIEW_ACCEPTABLE`

### UI gate

- `/resilience` loads on the Vercel Preview
- controlled cycle executes successfully
- score, findings, directives, connector state, blockers, and source truth render
- desktop, tablet, and mobile have no blocking overflow
- no blocking console or network error remains

### Evidence gate

- GitHub branch and commit verified
- draft pull request exists
- Vercel Preview source branch and commit verified
- Drive mission folder and workbook copy verified
- BrowserWorker evidence attached
- rollback instructions verified

## Definition of done

The Preview milestone is complete only when all code, API, UI, evidence, and rollback gates pass. Production remains a separate explicit operator approval.

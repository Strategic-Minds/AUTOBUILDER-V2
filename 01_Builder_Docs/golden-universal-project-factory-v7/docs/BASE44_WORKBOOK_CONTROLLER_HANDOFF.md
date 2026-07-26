# Base44 Workbook Controller Handoff

## Target
- App: `AUTO BUILDER ORCHESTRATOR`
- App ID: `6a4ae522852a5e08bfa42450`
- Project ID: `PILOT-PHX-EPOXY-PROS-20260725`
- Primary repo: `Strategic-Minds/AUTOBUILDER-V2`
- Controller branch: `auto-builder/install-golden-universal-project-factory-v7-workbook`

## Mission
Prove the complete workbook-to-working-Preview pipeline using the approved Phoenix Epoxy Pros Arizona web-pack and the V7 Golden Universal Project Factory workbook.

## Agent routing
1. `@xab`: read the workbook and project manifest, decompose the mission, create jobs, and track evidence.
2. `@scout`: inspect the approved asset folder and existing project context; produce a source-grounded content and competitor brief without drifting from the approved visual contract.
3. `@mira`: produce acceptance metrics, visual-parity rubric, operational test matrix, and confidence labels.
4. `@juno`: implement the Next.js website on a new project branch. The deliverable is committed code and a deployed Preview, not chat code.
5. `@rex`: open a draft PR, trigger the Preview deployment, capture IDs, and maintain rollback evidence.
6. `@kai`: independently test build, routes, navigation, CTAs, form behavior, security, desktop, tablet, mobile, and PWA behavior. Route each defect to a bounded repair loop with a maximum of three attempts.

## Mandatory sequence
`PLAN -> DISCOVERY -> VISUAL CONTRACT -> PROJECT DOCS -> PROVISIONING DRY RUN -> BRANCH BUILD -> VALIDATION -> BOUNDED REPAIR -> PREVIEW ACCEPTANCE`

## Source truth
- Workbook: https://docs.google.com/spreadsheets/d/1dI9te-lQ5hbbKWqMxnxrnjIz-ag1afI4/edit?usp=drivesdk&ouid=112498193653988253810&rtpof=true&sd=true
- Workbook SHA-256: `1980bc524a15a5c84a9dd596aaf726f869a7bd7dc7327b81d51968099662de5c`
- Approved Arizona epoxy source folder: https://drive.google.com/drive/folders/1VKWeEgaNv-azUmcI0n2Pk-wyjHu3S4f9
- Project manifest: `01_Builder_Docs/golden-universal-project-factory-v7/PILOT_PROJECT_MANIFEST.json`

## Acceptance requirements
- Real interactive Next.js website
- Full-width desktop layout and full page length
- Clear, sharp approved images
- Working navigation and CTA buttons
- Safe Preview lead-form behavior
- Service content covering epoxy and decorative-concrete offerings
- Desktop, tablet, mobile, and PWA validation
- No blocking console or network errors
- Visual-parity score backed by screenshots
- Operational-parity matrix for every visible interaction
- Rollback and repair receipts

## Allowed
Read, discovery, docs, branch writes, draft PR, Preview deployment, sandbox data, screenshots, non-production testing, bounded branch repair, and receipt writing.

## Blocked
Default-branch merge, Production deployment, Production database mutation, secret creation or replacement, domain changes, billing, payments, customer messaging, public publishing, and destructive actions.

## Stop condition
Stop after producing a READY Preview acceptance packet. Return the Preview URL, branch, commit, PR, screenshot evidence, validation results, score, repair receipts, and rollback reference. Do not merge or release Production without a new explicit operator approval.

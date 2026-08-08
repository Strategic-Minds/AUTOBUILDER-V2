# Golden One Image Pipeline Controller

## Current gate
`READY_FOR_BINARY_INPUTS`

## Canonical inputs
- Approved image: pending
- Golden Workbook: `GOLDEN_UNIVERSAL_ONE_IMAGE_AUTO_BUILDER_MASTER_WORKBOOK_V5_FINAL(1).xlsx`
- Workbook SHA-256: `d0a1f90dbf0299ef9008f8276dec0d23a23ab7ae46593c10fe15627ef2402ac2`
- Workbook bytes: `652782`

## Execution contract
1. Hash and register both binaries.
2. Extract workbook requirements into immutable requirement IDs.
3. Convert the image into a visual contract covering layout, typography, spacing, colors, components, states, responsive behavior, and assets.
4. Create a project control packet.
5. Run connector and provisioning dry-runs.
6. Create and build only the approved branch.
7. Deploy preview only.
8. Run lint, typecheck, unit, build, Playwright, accessibility, security, and visual checks.
9. Perform no more than three bounded repairs per defect.
10. Produce preview-acceptance evidence and stop before production.

## Source hierarchy
1. Current operator instruction
2. Approved image and its checksum
3. Golden Workbook and its checksum
4. Governance and approval rules
5. Runtime evidence
6. Repository code
7. Historical donor repositories

## Status values
- `READY_FOR_BINARY_INPUTS`
- `READY_FOR_DRY_RUN`
- `READY_FOR_BRANCH_BUILD`
- `VALIDATING`
- `REPAIRING`
- `READY_FOR_PREVIEW_ACCEPTANCE`
- `BLOCKED`
- `RELEASE_APPROVAL_REQUIRED`

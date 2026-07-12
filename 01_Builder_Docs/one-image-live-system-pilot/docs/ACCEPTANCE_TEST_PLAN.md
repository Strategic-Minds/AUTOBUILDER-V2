# Acceptance Test Plan

## Intake
- Image exists and SHA-256 is recorded.
- Workbook exists and SHA-256 matches the canonical hash.
- Operator approval points to the exact image hash.

## Build
- Work occurs only on `auto-builder/one-image-pipeline-pilot-001`.
- No default-branch write occurs.
- No donor repository is bulk merged.
- Build, lint, typecheck, and applicable unit tests pass.

## Runtime
- Preview returns HTTP 200.
- Main route loads without console errors.
- Critical interactions function on desktop and mobile.
- Queue, receipt, and validation records are created where supported.

## Visual parity
- Section order matches the approved image.
- Typography hierarchy matches.
- Spacing and alignment remain within approved tolerance.
- Colors, surfaces, borders, and component states match.
- Desktop and mobile screenshots are captured.
- Intentional deviations require operator approval.

## Governance
- Secrets are not committed or displayed.
- Production, DNS, billing, payments, customer messages, and live database changes remain untouched.
- Rollback instructions are tested or independently verified.

## Pass rule
PASS requires all critical tests to pass, zero unresolved critical defects, a verified rollback receipt, and operator preview acceptance.

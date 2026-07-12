# GPT -> Base44 Zero-Ambiguity Handoff

## Operating model
- GPT owns product strategy, exact UI contract, workbook architecture, orchestration, routing, and independent validation.
- Base44 owns implementation, authenticated account actions, sub-agent execution, connector operations, branch work, preview deployment, bounded repair, and durable receipts.
- The approved image and workbooks are binding source truth. Do not replace them with a generic design.

## Canonical inputs
- Execution workbook Drive ID: `1zQDsbH09HcfZzyZcMO2JTvh1W8Yzipc9`
- Execution workbook SHA-256: `9eb2481c9e88e07c10ccaf69be4e0db99193427d536b0b1056e3052c239a4074`
- Golden Workbook SHA-256: `d0a1f90dbf0299ef9008f8276dec0d23a23ab7ae46593c10fe15627ef2402ac2`
- Approved image Drive ID: `1ldjF0sUiEqCZxQHV1flwYqxIwzrXFtFo`
- Approved image SHA-256: `e9e58095261e0d860357de6f288f7357c5207d9f8014d9528b4c0d9302d4c90c`
- Repository: `Strategic-Minds/AUTOBUILDER-V2`
- Branch: `auto-builder/one-image-pipeline-pilot-001`
- Draft PR: `https://github.com/Strategic-Minds/AUTOBUILDER-V2/pull/4`

## Required sequence
1. Fetch and hash both binaries.
2. Register ProjectRegistry, JobRegistry, WorkflowRegistry, ReceiptRegistry, and OperatorDecisionRegistry records.
3. Query every record back and preserve IDs.
4. Install binaries on the feature branch only.
5. Diagnose the stale or uncorrelated Vercel `autobuilder-v2` binding.
6. Create or relink a preview-only Vercel project. Stop if secrets or environment changes are required.
7. Implement the exact routes and UI contract from the execution workbook.
8. Run build, lint/type checks when present, browser runtime, responsive, accessibility, security, data/RBAC, and >=95% visual-parity validation.
9. Perform no more than three narrow repairs per defect.
10. Produce deployment, screenshot, validation, repair, and rollback receipts.
11. Stop at preview acceptance. Do not merge or deploy production.

## Mandatory output
Return project record IDs, job record IDs, workflow record ID, branch commit SHAs, Vercel project and deployment IDs, preview URL, build logs, desktop/mobile screenshots, visual parity score, validation results, rollback receipt, blockers, and the exact operator decision required.

# ALPHA HEADFUL AI Workbook Controller

## PHASE / STEP
DOCS -> BRANCH INSTALL / STEP 3

## Source truth
- Workbook: `ALPHA_HEADFUL_AI_MAXIMUM_CEILING_WORKBOOK.xlsx`
- Google Drive file ID: `1LhzjZz_ReMAj4Ee4VaWJtGCEjMByKdCm`
- Google Drive folder ID: `1p3ZK6g7ELt7IBd0nZQCyIrHAOfqkrCZW`
- Drive URL: https://docs.google.com/spreadsheets/d/1LhzjZz_ReMAj4Ee4VaWJtGCEjMByKdCm/edit

## Repository binary status
The authenticated GitHub connector used for this install supports UTF-8 file writes but not direct `.xlsx` binary upload. The workbook binary is therefore installed durably in Google Drive and registered here as canonical source truth. Binary upload into this branch remains `pending_binary_upload` until performed through Codex, Git CLI, or another connector that supports binary bytes.

## Intended runtime linkage
This workbook governs the ALPHA HEADFUL AI frontend, backend, REST API, headful browser runtime, multi-agent orchestration, Supabase schema plan, Vercel Workflow, AI Gateway, validation, repair, rollback, and release gates.

## Gates
- Branch/preview only
- No direct write to `main`
- No production Vercel deployment
- No Supabase production migration
- No secret mutation
- No billing or spend
- No release without receipts and operator approval

## Required next validation
1. Upload the workbook binary to this folder on the current branch.
2. Validate workbook checksum against the Drive copy.
3. Run repo build, lint, typecheck, tests, and Playwright smoke.
4. Create a preview deployment from this branch.
5. Create a Supabase development branch or migration plan only after cost and operator approval.
6. Record all receipts under `03_Bridge_Receipts/workbooks/`.

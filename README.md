# AUTOBUILDER-V2

The v2 codebase for **AUTO BUILDER OS** — Jeremy Bensen's governed AI consulting + website-factory business, and the delivery engine for XPS (Xtreme Polishing Systems).

## Status
Ported from the v1 "AUTO_BUILDER_MASTER_OS" package (built 2026-06-29, previously living only in Google Drive — never in git). This is the first version of that package to actually build and pass CI. v1 Supabase tables/data remain untouched and are the live reference — nothing here overwrites them.

**Verified on 2026-07-02:** `npm install && npm run build` passes clean. All 7 API routes compile (cron, WhatsApp send/webhooks, ops health/budget, quality validate).

## What this is
A governed, agent-operated business factory that can plan, discover, brand, document, scaffold, validate, repair, and prepare release packages for websites, apps, lead-gen systems, and business operating systems — for AUTO BUILDER OS's own consulting clients and for XPS's 70-then-~100/month contractor website pipeline.

## Non-negotiable safety model
This is a scaffold and prompt/control system. It does not include secrets, live credentials, API keys, payment keys, DNS tokens, or production execution authority. Default mode: branch, sandbox, draft, dry-run, preview. Production deploys, Supabase migrations, credential changes, customer messages, social publishing, payments, DNS, and spend all require explicit operator approval.

## Core runtime
- Base44 Superagent — orchestrator (this agent)
- Strategic-Minds/AUTOBUILDER-V2 (this repo) — governance brain, source control, receipt surface
- Vercel — app/cron/workflow host
- Supabase — memory, queue, receipts, RAG, state (v1 schema retained)
- Google Shared Drive — human-readable source of truth (AUTO BUILDER OS / STRATEGIC MINDS AI LLC / XPS shared drives)
- Playwright Chromium — headless QA agent

## Repo layout
```
app/                    Next.js dashboard + API routes (cron, WhatsApp, ops, quality, webhooks)
tests/                  Playwright e2e tests
supabase/schema/        SQL migrations (master OS core, WhatsApp ops)
.agents/skills/         18 agent skill definitions + agent registry
docs/                   Full spec library (00-20), ported 1:1 from the v1 Drive package
.github/workflows/      CI: install, lint, build, Playwright e2e
```

## Docs index (`docs/`)
| # | Section | Covers |
|---|---|---|
| 00 | Master_Control | Kernel, manifest, command phrases |
| 01 | Universal_Drive_System | Drive folder blueprints |
| 02 | GitHub_Repo_System | Repo scaffold, workflows |
| 03 | Supabase_System | Migrations, RLS, memory, queues |
| 04 | Vercel_System | Cron, deployment env |
| 07 | Playbooks_Runbooks | Operating playbooks, auto-heal runbook |
| 08 | Forms_Intake | Universal business intake questions |
| 09 | Competitive_Intelligence | Discovery/benchmark/reverse-engineering |
| 10 | QA_AutoHeal | Scoring matrix, Playwright agent |
| 11 | Business_Planning_Docs | Business plan/strategy/financial/roadmap generator |
| 12 | Base44_Handoff | One-shot install prompts |
| 13 | WhatsApp_Omnichannel | Gateway + template catalog |
| 14 | Enterprise_Operations | Omnichannel operating model |
| 15 | Compliance_Security | Consent ledger, security matrix |
| 16 | Observability_FinOps | Tracing, budget guardrails |
| 17 | Agent_Evals_AutoHeal | Red-team evals, auto-heal policy |
| 18 | Client_Facing_Ops | Customer success/supportdesk |
| 19 | Deployment_Readiness | Release train, disaster recovery |
| 20 | Final_Audit | Gap analysis, enterprise scorecard |

## Local dev
```bash
npm install
cp .env.example.md .env.local   # then fill in real values — never commit secrets
npm run dev
npm run build
npm run test:e2e   # requires: npx playwright install --with-deps chromium
```

## Release rule (from `docs/20_Final_Audit/FINAL_ENTERPRISE_SCORECARD.md`)
No tenant or system releases to production until the enterprise scorecard totals ≥95 and every critical gate passes (no secrets in repo, RLS enabled, consent checked before outbound messaging, production deploy approved, rollback exists, smoke + Playwright pass, cost budget configured, human escalation path configured).

## What's still open (honest gap list, not yet built)
- 12 factory adapters are still stubbed at the Supabase level (content gen, SEO, image queue, payment gate, WhatsApp sync, social, quality scan, auto-heal/fix/harden, competitor intel, template intel) — this repo gives them a real home, not real implementations yet.
- XPS RAG ingestion pipeline (`rag_documents`/`rag_chunks`/`rag_embeddings` tables exist, empty).
- Real secrets/env values (see `.env.example.md`) — must be set in Vercel/Supabase dashboards, never in this repo.
- Full Playwright e2e run against a live deployment (build is verified; live-environment e2e run is not).

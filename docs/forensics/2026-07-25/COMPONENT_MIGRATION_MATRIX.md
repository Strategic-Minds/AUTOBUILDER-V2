# Component Migration Matrix

## Status legend

- KEEP: retain in AUTOBUILDER-V2
- IMPORT: copy or port from donor after review
- ADAPT: reimplement against destination contracts
- EXTERNAL: keep independent and integrate through an adapter
- REJECT: do not migrate
- VERIFY: evidence required before decision

| Capability | Destination decision | Donor | Required gate |
|---|---|---|---|
| Next.js runtime | KEEP | AUTOBUILDER-V2 | build, lint, type-check |
| project/admin UI | KEEP + IMPORT | AUTOBUILDER-V2 + auto-builder-os | route map, responsive screenshots |
| PWA | IMPORT | XAB | installability, offline shell, manifest tests |
| accessibility validation | IMPORT | XAB | axe/Playwright pass |
| security validation | IMPORT | XAB | no high vulnerabilities, secret scan |
| OpenTelemetry | IMPORT | XAB | trace emission in preview |
| Sentry integration | ADAPT | XAB | environment-safe preview proof |
| structured logging | IMPORT | XAB | redaction tests |
| GPT bridge | IMPORT | AUTO_BUILDER-V1 | authenticated dry-run smoke test |
| MCP provider registry | IMPORT | AUTO_BUILDER-V1 | schema validation and tool allowlist |
| queue runner | ADAPT | AUTO_BUILDER-V1 | lease, retry, idempotency, dead-letter tests |
| factory registry | IMPORT | AUTO_BUILDER-V1 | registry schema and migration test |
| runtime contracts | IMPORT | AUTO_BUILDER-V1 | TypeScript contract tests |
| cron authentication | IMPORT | AUTO_BUILDER-V1 | missing-secret denial test |
| Vercel Sandbox | IMPORT | AUTO_BUILDER-V1 | preview-only execution receipt |
| durable queue engine | ADAPT | V1 + v0-auto-builder-v2 | Supabase-vs-Redis architecture decision |
| BullMQ/Redis patterns | VERIFY | v0-auto-builder-v2 | cost, durability, vendor necessity review |
| GitHub Octokit adapter | IMPORT | v0-auto-builder-v2 | branch-only integration test |
| multi-model router | ADAPT | v0-auto-builder-v2 | budget, fallback, telemetry tests |
| real-time events | VERIFY | v0-auto-builder-v2 | prove need before Socket.IO import |
| Figma adapter | VERIFY | v0-auto-builder-v2 | explicit project requirement |
| BrowserWorker | EXTERNAL | Strategic-Minds/BROWSERWORKER | versioned API contract and evidence bundle |
| V6 workbook | INSTALL | operator-approved workbook | checksum, manifest, binary verification |
| five-minute validator | ADAPT | V2 + V1 | auth, leases, stale jobs, receipts, safe requeue tests |
| visual parity loop | ADAPT | BrowserWorker + V2 | three viewport evidence, critical-region gates |
| bounded repair | ADAPT | V2 + V1 | three-attempt limit, regression proof |
| release controller | KEEP + HARDEN | V2 | critical-gate fail-closed tests |
| production deployment | BLOCKED | none | explicit operator approval |

## Import order

1. Canonical contracts and source-truth manifests
2. Validation, security, logging, and observability
3. GPT bridge and MCP registry
4. Queue, lease, attempt, receipt, and memory contracts
5. GitHub and Vercel preview adapters
6. BrowserWorker adapter
7. UI migration
8. project-instantiation engine
9. bounded repair and release controller
10. golden-path preview validation

## Compatibility rule

The destination remains on its selected stable dependency baseline until each donor module has been ported and tested. Do not bulk-upgrade Next.js, React, AI SDK, Zod, or Supabase packages merely to match a donor repository.

# Final Enterprise Scorecard

## Scoring categories
- Governance and approvals: 10
- Agent skills and subagents: 10
- Drive source truth: 8
- GitHub branch/PR system: 8
- Supabase memory/queues/RLS: 10
- Vercel cron/workflows/deploy: 8
- Frontend dashboard/PWA/chat: 8
- QA, Playwright, auto-heal: 8
- Competitive intelligence: 7
- Omnichannel/WhatsApp/SMS/email: 8
- Observability/FinOps: 7
- Security/compliance/secrets: 8
- Backup/DR/incident response: 5
- Licensing/client support: 5

## Release rule
A tenant or system cannot release to production until total score is at least 95 and no critical gate is failed.

## Critical gates
- No secrets in repo.
- RLS enabled for tenant tables.
- Consent checked before outbound messaging.
- Production deploy approved.
- Rollback exists.
- Smoke and Playwright pass.
- Cost budget configured.
- Human escalation path configured.

# Observability and FinOps

## Observability requirements
- request_id on every request
- run_id on every workflow
- agent_id on every action
- tenant_id on every tenant action
- trace_id on tool calls
- cost estimate on AI/browser/tool calls
- result status: pass | fail | partial | blocked | quarantined
- receipt link

## Dashboards
- Kernel health
- Queue health
- Cron health
- Webhook health
- AI Gateway/model cost
- Supabase health
- Vercel deploy health
- Playwright QA score
- Auto-heal iteration history
- WhatsApp/SMS/email send volume
- Lead conversion funnel
- Tenant/license usage

## FinOps guardrails
- Daily model spend limit
- Monthly model spend limit
- Per-tenant budget
- Browser automation budget
- Video/image generation budget
- Social publishing budget
- Escalation when 80 percent budget reached
- Hard stop when 100 percent budget reached

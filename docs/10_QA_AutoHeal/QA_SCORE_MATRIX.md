# QA Score Matrix

Total: 100

- Build and type safety: 10
- Lint/static quality: 8
- Route availability: 8
- API smoke checks: 8
- Playwright desktop: 8
- Playwright mobile: 8
- PWA install basics: 6
- Accessibility basics: 8
- SEO basics: 8
- Security/gates/no secrets: 10
- Supabase/RLS readiness: 8
- Receipts and rollback: 10

## Critical failures
Any of these block release regardless of score:
- secrets committed
- production mutation without approval
- payment action without approval
- destructive DB action without approval
- customer messages without approval
- live social publish without approval
- no rollback path
- broken homepage

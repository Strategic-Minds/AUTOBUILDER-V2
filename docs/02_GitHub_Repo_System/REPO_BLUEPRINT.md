# GitHub Repo System

## Required repo
Strategic-Minds/AUTO_BUILDER

## Branch strategy
- main: production protected
- develop: integration
- auto-builder/*: branch-safe agent work
- docs/*: documentation-only changes
- receipts/*: validation evidence

## Required files
- AGENTS.md
- .agents/skills/*/SKILL.md
- .github/workflows/auto-builder-validate.yml
- vercel.json
- package.json
- supabase/migrations/*.sql
- app/api/cron/auto-builder/route.ts
- app/api/quality/validate/route.ts
- app/api/intelligence/ingest/route.ts
- app/api/agents/message/route.ts
- app/api/agents/replicate/route.ts
- tests/*.spec.ts

## Required protections
- No direct push to main
- PR required for production
- Required status checks
- Required review for production-impacting files
- Secret scanning enabled where available

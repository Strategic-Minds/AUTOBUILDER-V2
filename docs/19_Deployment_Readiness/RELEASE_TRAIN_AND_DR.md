# Release Train and Disaster Recovery

## Environment ladder
sandbox -> preview -> staging -> production

## Release train rules
- No direct production change.
- Every production candidate requires receipts.
- Every database change requires migration file and rollback note.
- Every customer-facing change requires screenshots and QA score.
- Every messaging change requires consent/template review.

## Disaster recovery requirements
- Supabase backup/export plan.
- Drive source-truth backup plan.
- GitHub branch/tag release points.
- Vercel instant rollback plan.
- Provider credential recovery plan.
- Incident communication templates.
- Restore drill schedule.

# Dependency Repair Receipt

Date: 2026-08-20
Mission: AUTONOMOUS-BACKLOG-ENGINE-V1-20260820

## Finding
`AUTO_BUILDER Master Validate` stopped before branch tests because the production dependency lock resolved `nanoid 3.3.16`, which was covered by GHSA-mwcw-c2x4-8c55.

## Root cause
`postcss 8.5.23` permits `nanoid ^3.3.16`, while the lockfile had frozen `nanoid 3.3.16`.

## Repair
A branch-only GitHub Actions repair job ran `npm audit fix --package-lock-only --omit=dev --audit-level=high` under a diff guard that allowed only `node_modules/nanoid`. It required the resulting version to equal `3.3.18`, required `package.json` to remain unchanged, and required `npm audit --omit=dev --audit-level=high` to pass before committing.

The repair job completed successfully and created the branch commit containing the repaired lockfile. Subsequent workflow runs from that bot-generated commit were marked `action_required` because GitHub prevents recursive workflow execution from `GITHUB_TOKEN` pushes. This receipt commit intentionally retriggers normal PR validation from the operator-owned connector against the repaired branch head.

Production mutation: false.

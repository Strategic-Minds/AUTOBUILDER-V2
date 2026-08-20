# Autonomous Backlog Engine V1 System Contract

Mission: `AUTONOMOUS-BACKLOG-ENGINE-V1-20260820`

## Objective
MAXIMIZE VERIFIED PROFITABLE BACKLOG GENERATED PER CUSTOMER.

## Native integration
- Runtime authority: `Strategic-Minds/AUTOBUILDER-V2`.
- Timer: existing `GET /api/cron/auto-builder`, every five minutes.
- Hourly recursion: one atomic 55-minute lease per UTC hour.
- Database access: server/service-role only.
- Browser evidence: BrowserWorker is current canonical evidence authority; CloudBrowser may satisfy the same non-mutating evidence contract when separately authorized.
- Production: locked until explicit operator approval.

## Economic truth rules
- Opportunity value is pipeline, not backlog.
- Prepared bid value is pipeline, not backlog.
- Submitted bid value is pipeline, not backlog.
- `award.won` with independent award evidence is verified backlog.
- Realized gross profit requires financial evidence.
- Simulations are always labeled simulation.

## Protected actions
Default blocked without an explicit approval receipt:
- default-branch merge;
- Production deploy/promotion;
- production DB migration;
- secrets, domains, billing or spend;
- destructive operations;
- customer communication;
- bid submission;
- contract acceptance.

## Hourly loop
`OBSERVE -> SCORE -> RANK -> SELECT -> DRAFT WORK PACKET -> VALIDATE -> COMPARE -> RECORD -> LEARN`

The hourly loop may prepare recommendations and evidence. It may not cross a protected-action boundary.

## First proof wedge
Commercial specialty concrete / epoxy / polished concrete, while keeping data contracts trade-neutral.

## Release state
`AWAITING_PRODUCTION_APPROVAL` until Preview evidence, rollback evidence, migration review, and operator approval are complete.

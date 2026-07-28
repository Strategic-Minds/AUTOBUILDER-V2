# Read-Only Autonomous Coding Template Policy

## Status

Production-first and validation-gated. Preview is an intermediate validation stage, not the final destination.

## Canonical template

- Command authority: `Strategic-Minds/XAB`
- Execution runtime: `Strategic-Minds/AUTOBUILDER-V2`
- Reusable template: `Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM`
- Isolated proof repository: `Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM-SANDBOX`
- Independent validator: `Strategic-Minds/BROWSERWORKER`
- Preview boundary: Vercel project `uacs-autonomous-sandbox`
- Default final destination: validated Vercel production release

## Read-only rule

Factory jobs may read the canonical template, inspect its manifests, and copy approved files into a new private repository or generated feature branch. They may not write generated client or project code back into the canonical template default branch.

Changes to the template itself require:

1. A dedicated template-maintenance branch.
2. A draft pull request.
3. Validation receipts.
4. BrowserWorker evidence when UI behavior changes.
5. A release receipt before protected-branch merge and production promotion.

## Provisioning rule

Every generated system receives its own durable identity:

- project ID and correlation ID
- Drive project folder
- GitHub repository or feature branch
- Vercel preview project or branch deployment
- development-only Supabase boundary when stateful
- Base44 registry record
- approval-manifest SHA-256
- validation, repair, rollback, and release receipts
- production deployment after every mandatory gate passes

## Approval lock

Execution is blocked until the XAB packet includes an immutable approval manifest tying together the approved idea, logo, brand pack, visual reference, workflow option, and source-truth references.

## Autonomous repair loop

The five-minute Vercel control loop runs:

1. Auto-reflect
2. Auto-fix recipe generation
3. Auto-heal work-packet creation
4. Auto-harden security scan
5. Independent validation

The loop is bounded to five repair iterations. It cannot alter secrets, change DNS, spend money, contact customers, publish social content, execute unapproved production database migrations, or perform destructive operations.

## Release policy

A generated project remains in preview only while mandatory evidence is incomplete. Once build, security, BrowserWorker desktop/tablet/mobile, operational parity, smoke-test, rollback, and release receipts pass, the default next action is protected-branch merge and production promotion. Missing evidence is a failed gate, not a warning.

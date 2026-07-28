# Read-Only Autonomous Coding Template Policy

## Status

Branch and sandbox only. Production remains locked.

## Canonical template

- Command authority: `Strategic-Minds/XAB`
- Execution runtime: `Strategic-Minds/AUTOBUILDER-V2`
- Reusable template: `Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM`
- Isolated proof repository: `Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM-SANDBOX`
- Independent validator: `Strategic-Minds/BROWSERWORKER`
- Preview boundary: Vercel project `uacs-autonomous-sandbox`

## Read-only rule

Factory jobs may read the canonical template, inspect its manifests, and copy approved files into a new private repository or generated feature branch. They may not write generated client or project code back into the canonical template default branch.

Changes to the template itself require:

1. A dedicated template-maintenance branch.
2. A draft pull request.
3. Validation receipts.
4. BrowserWorker evidence when UI behavior changes.
5. Explicit operator approval before protected-branch merge.

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

## Approval lock

Execution is blocked until the XAB packet includes an immutable approval manifest tying together the approved idea, logo, brand pack, visual reference, workflow option, and source-truth references.

## Autonomous repair loop

The five-minute Vercel control loop runs:

1. Auto-reflect
2. Auto-fix recipe generation
3. Auto-heal work-packet creation
4. Auto-harden security scan
5. Independent validation

The loop is bounded to five repair iterations. It cannot merge protected branches, deploy production, alter secrets, change DNS, spend money, contact customers, publish content, or perform destructive operations.

## Release policy

A generated project remains preview-only until all mandatory evidence exists. Missing evidence is a failed gate, not a warning.

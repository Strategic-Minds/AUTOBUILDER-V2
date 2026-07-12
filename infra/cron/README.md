# infra/cron/

Real cron jobs currently running (as Base44 Superagent automations, NOT Vercel cron -
no production deploy has happened, so no Vercel cron config exists yet):

1. Queue Heartbeat - every 30 min (automation id 6a46d0ce8eb0e05cb4e6e9f3)
2. Registry Reconciliation Sync - every hour (automation id 6a46d0ce8eb0e05cb4e6e9f4)
3. Twice-Daily Test, Score & Drift Review - 9am/9pm ET (automation id 6a46d0ce8eb0e05cb4e6e9f5)
4. Nightly Repair, Hardening & Intelligence Drain - 2am ET (automation id 6a46d0ce8eb0e05cb4e6e9f6)
5. AUTO BUILDER 2.0 Drift Check - daily 9am ET (automation id 6a45ad92941f5314b6cdf5fb)

If/when this app is deployed to Vercel, these could migrate to real `vercel.json` cron
entries calling `app/api/cron/*` routes - not done yet because production deploy is not
approved and because these crons currently need Base44 entity access, which the deployed
app does not have (see docs/architecture/CONTROL_PLANE_TOPOLOGY.md).

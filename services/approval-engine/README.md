# approval-engine

**Status: NOT YET IMPLEMENTED as an independent repo service.**

Today, the function of this service is performed by the Base44 Superagent directly:
it reads/writes the corresponding registry entity (Base44 entities, not Supabase tables)
on a cron trigger or on-demand, and applies the governance/approval rules itself.

This folder exists to mark the target extraction point if/when Jeremy wants this logic
to run as an independent, deployable backend service rather than inside the orchestrating
agent. That would require: (1) giving this repo's deployed app read/write access to the
Base44 entities API (it currently only talks to Supabase), and (2) a decision on hosting
(Vercel serverless functions vs a long-running worker).

See ../../docs/architecture/CONTROL_PLANE_TOPOLOGY.md for the full real-vs-target mapping.
Not faked as functional - do not wire this into a build step until real logic is written here.

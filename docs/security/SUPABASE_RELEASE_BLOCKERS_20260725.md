# Supabase Release Blockers

Date: 2026-07-25
Project ref: `azajysheebfhyzoyplpf`
Environment affected: existing shared project
Production mutation performed: **NO**

## Gate status

`BLOCKED`

The project reports healthy runtime availability, but current security-advisor and migration evidence does not support production release of a consolidated control plane.

## Verified blocker classes

### Public tables without RLS

Security advisors identify numerous public-schema tables with row-level security disabled. Affected categories include:

- project and build state
- jobs, queues, leases, and attempts
- approvals and operator decisions
- tool calls and executions
- connectors
- validation and receipts
- memory and intelligence
- factory and template records
- browser and chat sessions

This is release-blocking because browser clients or exposed API roles may reach records outside the intended tenant or operator boundary.

### Sensitive session exposure

Session-oriented tables were identified without adequate RLS while containing session identifiers. These records must not be considered safe for direct browser access.

### Privileged function execution

Security advisors report anonymous or broadly authenticated execution rights on privileged queue, claim, release, and lease functions. These functions require explicit role boundaries, `search_path` hardening, and negative authorization tests.

### RLS enabled without effective policies

Some tables have RLS enabled but no effective policies. This can break legitimate operation while providing a false sense of completion.

### Overly permissive policies

Always-true or broadly permissive policies were reported. These require tenant, project, operator, service-role, and ownership predicates.

### Storage exposure

The generated-assets storage surface permits public listing. Asset publication and directory enumeration need separate policies and signed-access rules.

### Authentication hardening

Leaked-password protection is disabled. Authentication policy must be reviewed before release.

### Migration drift

The Supabase branching surface reports `MIGRATIONS_FAILED`. This must be reconciled before a new migration is trusted.

## Required remediation packet

Create, review, and test a development-only migration that:

1. inventories every exposed public table and function,
2. assigns an owner and data classification,
3. enables RLS where browser/API access exists,
4. adds explicit deny-by-default policies,
5. adds tenant, project, operator, and service-role predicates,
6. revokes anonymous execution from privileged functions,
7. hardens function `search_path`,
8. restricts storage listing and writes,
9. adds negative authorization tests,
10. documents rollback for every policy and grant change,
11. passes Supabase security advisors after application,
12. is validated on a development branch before production approval.

## Protected actions

The following remain prohibited without a separate operator approval and reviewed rollback packet:

- applying the migration to the existing primary project,
- merging a Supabase development branch,
- changing authentication providers or keys,
- exposing service-role credentials,
- deleting or rewriting production records,
- weakening RLS to make tests pass.

## Release acceptance criteria

- no unresolved high-severity advisor errors in the consolidated schema surface,
- no privileged anonymous function execution,
- no sensitive session table exposed without tested RLS,
- all required browser-accessible tables have positive and negative policy tests,
- storage policies pass list/read/write/delete tests by role,
- migration and rollback both execute successfully in development,
- receipt chain records the exact migration version and test results.

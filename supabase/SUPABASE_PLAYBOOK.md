# Supabase System Playbook

## Tables
- agents: identities and permissions
- agent_messages: communication bus
- swarm_tasks: task state machine
- approvals: human gates
- receipts: validation proof
- intelligence_sources/chunks: RAG source library
- qa_scores: score history
- auto_heal_runs: repair loop receipts
- template_registry: reusable systems, sites, dashboards, forms, workflows

## Apply order
1. Review SQL in branch.
2. Confirm project ID.
3. Confirm backup.
4. Apply migration in staging.
5. Run RLS smoke tests.
6. Run dashboard connection test.
7. Stop for production approval.

## Never store
- private API keys in tables
- OAuth client secrets
- payment secrets
- customer passwords
- raw credentials

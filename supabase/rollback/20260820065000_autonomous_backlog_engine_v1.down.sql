begin;

-- ROLLBACK FOR 20260820065000_autonomous_backlog_engine_v1.sql
-- Execute only with explicit operator approval after confirming no production evidence
-- must be retained. Prefer archive/export before dropping tables with real customer data.

revoke all on function public.backlog_claim_hourly_lease(text,text,text,integer) from service_role;
revoke all on function public.backlog_finish_hourly_lease(uuid,uuid,text,jsonb) from service_role;
drop function if exists public.backlog_claim_hourly_lease(text,text,text,integer);
drop function if exists public.backlog_finish_hourly_lease(uuid,uuid,text,jsonb);

drop table if exists public.backlog_validation_receipts;
drop table if exists public.backlog_improvement_runs;
drop table if exists public.backlog_execution_leases;
drop table if exists public.backlog_economic_attribution_events;
drop table if exists public.backlog_outcomes;
drop table if exists public.backlog_bids;
drop table if exists public.backlog_opportunities;
drop table if exists public.backlog_customers;

commit;

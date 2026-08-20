-- READ-ONLY VALIDATION FOR AUTONOMOUS BACKLOG ENGINE V1
select t.table_name, c.relrowsecurity as row_security
from information_schema.tables t
join pg_class c on c.relname = t.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
where t.table_schema = 'public'
  and t.table_name in (
    'backlog_customers','backlog_opportunities','backlog_bids','backlog_outcomes',
    'backlog_economic_attribution_events','backlog_execution_leases',
    'backlog_improvement_runs','backlog_validation_receipts'
  )
order by t.table_name;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('backlog_claim_hourly_lease','backlog_finish_hourly_lease')
order by routine_name;

begin;

revoke all on function public.xab_v3_claim_workflow_job(text, integer) from service_role;
revoke all on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) from service_role;
revoke all on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) from service_role;
revoke all on function public.xab_v3_approve_option(uuid, text, integer, text, text, text, boolean) from service_role;

drop function if exists public.xab_v3_claim_workflow_job(text, integer);
drop function if exists public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer);
drop function if exists public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer);
drop function if exists public.xab_v3_approve_option(uuid, text, integer, text, text, text, boolean);

drop index if exists public.xab_v3_workflow_jobs_claim_idx;

alter table public.xab_v3_workflow_jobs
  drop column if exists dead_lettered_at,
  drop column if exists finished_at,
  drop column if exists last_heartbeat_at,
  drop column if exists lease_token,
  drop column if exists available_at;

commit;

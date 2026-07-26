begin;

revoke execute on function public.xab_finish_base44_bridge_job(uuid, text, boolean, jsonb, text, integer) from service_role;
revoke execute on function public.xab_claim_base44_bridge_job(text, integer) from service_role;

drop function if exists public.xab_finish_base44_bridge_job(uuid, text, boolean, jsonb, text, integer);
drop function if exists public.xab_claim_base44_bridge_job(text, integer);
drop table if exists public.xab_base44_bridge_receipts;
drop table if exists public.xab_base44_bridge_jobs;

commit;

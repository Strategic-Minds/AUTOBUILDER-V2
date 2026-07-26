do $$
begin
  if to_regclass('public.xro_runs') is not null and to_regclass('public.xab_validation_runs') is null then
    alter table public.xro_runs rename to xab_validation_runs;
  end if;

  if to_regclass('public.xro_browser_jobs') is not null and to_regclass('public.xab_validation_browser_jobs') is null then
    alter table public.xro_browser_jobs rename to xab_validation_browser_jobs;
  end if;

  if to_regclass('public.xro_receipts') is not null and to_regclass('public.xab_validation_receipts') is null then
    alter table public.xro_receipts rename to xab_validation_receipts;
  end if;
end
$$;

alter index if exists public.xro_runs_mission_created_idx rename to xab_validation_runs_mission_created_idx;
alter index if exists public.xro_browser_jobs_run_idx rename to xab_validation_browser_jobs_run_idx;
alter index if exists public.xro_receipts_run_idx rename to xab_validation_receipts_run_idx;

alter table public.xab_validation_runs enable row level security;
alter table public.xab_validation_runs force row level security;
alter table public.xab_validation_browser_jobs enable row level security;
alter table public.xab_validation_browser_jobs force row level security;
alter table public.xab_validation_receipts enable row level security;
alter table public.xab_validation_receipts force row level security;

revoke all on public.xab_validation_runs from anon, authenticated;
revoke all on public.xab_validation_browser_jobs from anon, authenticated;
revoke all on public.xab_validation_receipts from anon, authenticated;
grant select, insert, update, delete on public.xab_validation_runs to service_role;
grant select, insert, update, delete on public.xab_validation_browser_jobs to service_role;
grant select, insert, update, delete on public.xab_validation_receipts to service_role;

drop policy if exists xro_runs_service_role_all on public.xab_validation_runs;
drop policy if exists xro_browser_jobs_service_role_all on public.xab_validation_browser_jobs;
drop policy if exists xro_receipts_service_role_all on public.xab_validation_receipts;
drop policy if exists xab_validation_runs_service_role_all on public.xab_validation_runs;
drop policy if exists xab_validation_browser_jobs_service_role_all on public.xab_validation_browser_jobs;
drop policy if exists xab_validation_receipts_service_role_all on public.xab_validation_receipts;

create policy xab_validation_runs_service_role_all on public.xab_validation_runs for all to service_role using (true) with check (true);
create policy xab_validation_browser_jobs_service_role_all on public.xab_validation_browser_jobs for all to service_role using (true) with check (true);
create policy xab_validation_receipts_service_role_all on public.xab_validation_receipts for all to service_role using (true) with check (true);

-- rollback:
-- alter table public.xab_validation_receipts rename to xro_receipts;
-- alter table public.xab_validation_browser_jobs rename to xro_browser_jobs;
-- alter table public.xab_validation_runs rename to xro_runs;

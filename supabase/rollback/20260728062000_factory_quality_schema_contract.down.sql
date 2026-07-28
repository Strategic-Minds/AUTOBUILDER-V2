begin;

-- ROLLBACK FOR 20260728062000_factory_quality_schema_contract.sql
-- WARNING: the final section restores the pre-migration permission state,
-- including broad anon/authenticated grants and disabled RLS on the three
-- legacy factory tables. Use only for an immediate verified rollback, then
-- reopen the security incident because that original state is unsafe.

revoke all on public.factory_quality_findings from service_role;
revoke all on public.factory_quality_scores from service_role;

alter table if exists public.factory_repair_jobs disable row level security;
alter table if exists public.factory_receipts disable row level security;
alter table if exists public.auto_heal_runs disable row level security;

grant all privileges on public.factory_repair_jobs to anon, authenticated, service_role;
grant all privileges on public.factory_receipts to anon, authenticated, service_role;
grant all privileges on public.auto_heal_runs to anon, authenticated, service_role;

drop index if exists public.auto_heal_runs_project_iteration_idx;
drop index if exists public.factory_repair_jobs_finding_active_idx;
drop index if exists public.factory_quality_scores_project_idx;
drop index if exists public.factory_quality_findings_autofix_idx;
drop index if exists public.factory_quality_findings_project_open_idx;

alter table if exists public.auto_heal_runs
  drop column if exists patch_branch;

alter table if exists public.factory_repair_jobs
  drop column if exists recipe,
  drop column if exists repair_type,
  drop column if exists finding_id,
  drop column if exists project_id;

drop table if exists public.factory_quality_scores;
drop table if exists public.factory_quality_findings;

commit;

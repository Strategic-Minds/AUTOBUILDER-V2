do $$
declare
  table_name text;
  index_name text;
begin
  foreach table_name in array array[
    'factory_quality_findings',
    'factory_quality_scores',
    'factory_repair_jobs',
    'factory_receipts',
    'auto_heal_runs'
  ] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'required table missing: %', table_name;
    end if;

    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relrowsecurity
    ) then
      raise exception 'RLS not enabled: %', table_name;
    end if;

    if has_table_privilege('anon', 'public.' || table_name, 'SELECT')
      or has_table_privilege('anon', 'public.' || table_name, 'INSERT')
      or has_table_privilege('anon', 'public.' || table_name, 'UPDATE')
      or has_table_privilege('anon', 'public.' || table_name, 'DELETE') then
      raise exception 'anon retains access: %', table_name;
    end if;

    if has_table_privilege('authenticated', 'public.' || table_name, 'SELECT')
      or has_table_privilege('authenticated', 'public.' || table_name, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || table_name, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || table_name, 'DELETE') then
      raise exception 'authenticated retains access: %', table_name;
    end if;

    if not has_table_privilege('service_role', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'service_role lacks required access: %', table_name;
    end if;
  end loop;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'factory_repair_jobs' and column_name = 'project_id'
  ) then raise exception 'factory_repair_jobs.project_id missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'factory_repair_jobs' and column_name = 'finding_id'
  ) then raise exception 'factory_repair_jobs.finding_id missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'factory_repair_jobs' and column_name = 'repair_type'
  ) then raise exception 'factory_repair_jobs.repair_type missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'factory_repair_jobs' and column_name = 'recipe'
  ) then raise exception 'factory_repair_jobs.recipe missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'auto_heal_runs' and column_name = 'patch_branch'
  ) then raise exception 'auto_heal_runs.patch_branch missing'; end if;

  foreach index_name in array array[
    'factory_repair_jobs_finding_active_idx',
    'factory_quality_findings_project_open_idx',
    'factory_quality_findings_autofix_idx',
    'factory_quality_scores_project_idx',
    'auto_heal_runs_project_iteration_idx'
  ] loop
    if to_regclass('public.' || index_name) is null then
      raise exception 'required index missing: %', index_name;
    end if;
  end loop;
end
$$;

begin;
set local role service_role;

insert into public.factory_quality_findings (
  project_id, category, severity, description, source, auto_fixable, fix_recipe
) values (
  'ci-contract', 'schema', 'medium', 'isolated contract test', 'github-actions', true, '{"kind":"test"}'::jsonb
);

insert into public.factory_quality_scores (
  score_id, project_id, score_type, score, grade
) values (
  'ci-contract-score', 'ci-contract', 'composite', 100, 'A'
);

insert into public.factory_repair_jobs (
  project_id, finding_id, repair_type, recipe, failure_fingerprint, defect_description
)
select
  'ci-contract', id, 'schema', '{"action":"noop"}'::jsonb, 'ci-fingerprint', 'isolated repair insert'
from public.factory_quality_findings
where project_id = 'ci-contract'
limit 1;

insert into public.factory_receipts (
  receipt_type, status, produced_by, action_summary, evidence, rollback_available
) values (
  'validation', 'pass', 'github-actions', 'factory schema contract', '{"isolated":true}'::jsonb, true
);

insert into public.auto_heal_runs (
  project_id, iteration, status, patch_branch
) values (
  'ci-contract', 1, 'blocked', 'validation/factory-schema-ci-20260728'
);

rollback;

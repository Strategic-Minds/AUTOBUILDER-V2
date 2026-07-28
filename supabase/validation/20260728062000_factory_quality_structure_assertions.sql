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

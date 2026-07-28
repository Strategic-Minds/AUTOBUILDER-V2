do $$
declare
  required_table text;
  required_index text;
begin
  foreach required_table in array array[
    'factory_quality_findings',
    'factory_quality_scores',
    'factory_repair_jobs',
    'factory_receipts',
    'auto_heal_runs'
  ] loop
    if to_regclass('public.' || required_table) is null then
      raise exception 'required table missing: %', required_table;
    end if;
  end loop;

  if not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'factory_repair_jobs' and c.column_name = 'project_id'
  ) then raise exception 'factory_repair_jobs.project_id missing'; end if;

  if not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'factory_repair_jobs' and c.column_name = 'finding_id'
  ) then raise exception 'factory_repair_jobs.finding_id missing'; end if;

  if not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'factory_repair_jobs' and c.column_name = 'repair_type'
  ) then raise exception 'factory_repair_jobs.repair_type missing'; end if;

  if not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'factory_repair_jobs' and c.column_name = 'recipe'
  ) then raise exception 'factory_repair_jobs.recipe missing'; end if;

  if not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'auto_heal_runs' and c.column_name = 'patch_branch'
  ) then raise exception 'auto_heal_runs.patch_branch missing'; end if;

  foreach required_index in array array[
    'factory_repair_jobs_finding_active_idx',
    'factory_quality_findings_project_open_idx',
    'factory_quality_findings_autofix_idx',
    'factory_quality_scores_project_idx',
    'auto_heal_runs_project_iteration_idx'
  ] loop
    if to_regclass('public.' || required_index) is null then
      raise exception 'required index missing: %', required_index;
    end if;
  end loop;
end
$$;

do $$
declare
  required_table text;
begin
  if to_regclass('public.factory_quality_findings') is not null then
    raise exception 'factory_quality_findings still exists after rollback';
  end if;

  if to_regclass('public.factory_quality_scores') is not null then
    raise exception 'factory_quality_scores still exists after rollback';
  end if;

  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'factory_repair_jobs'
      and c.column_name in ('project_id', 'finding_id', 'repair_type', 'recipe')
  ) then
    raise exception 'factory_repair_jobs migration columns remain after rollback';
  end if;

  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'auto_heal_runs' and c.column_name = 'patch_branch'
  ) then
    raise exception 'auto_heal_runs.patch_branch remains after rollback';
  end if;

  foreach required_table in array array[
    'factory_repair_jobs',
    'factory_receipts',
    'auto_heal_runs'
  ] loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = required_table
        and c.relrowsecurity
    ) then
      raise exception 'RLS remains enabled after rollback: %', required_table;
    end if;

    if not has_table_privilege('anon', 'public.' || required_table, 'SELECT')
      or not has_table_privilege('anon', 'public.' || required_table, 'INSERT')
      or not has_table_privilege('anon', 'public.' || required_table, 'UPDATE')
      or not has_table_privilege('anon', 'public.' || required_table, 'DELETE') then
      raise exception 'anon pre-migration privileges not restored: %', required_table;
    end if;

    if not has_table_privilege('authenticated', 'public.' || required_table, 'SELECT')
      or not has_table_privilege('authenticated', 'public.' || required_table, 'INSERT')
      or not has_table_privilege('authenticated', 'public.' || required_table, 'UPDATE')
      or not has_table_privilege('authenticated', 'public.' || required_table, 'DELETE') then
      raise exception 'authenticated pre-migration privileges not restored: %', required_table;
    end if;
  end loop;
end
$$;

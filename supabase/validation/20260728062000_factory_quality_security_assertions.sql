do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'factory_quality_findings',
    'factory_quality_scores',
    'factory_repair_jobs',
    'factory_receipts',
    'auto_heal_runs'
  ] loop
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

    if not has_table_privilege('service_role', 'public.' || table_name, 'SELECT')
      or not has_table_privilege('service_role', 'public.' || table_name, 'INSERT')
      or not has_table_privilege('service_role', 'public.' || table_name, 'UPDATE')
      or not has_table_privilege('service_role', 'public.' || table_name, 'DELETE') then
      raise exception 'service_role lacks required access: %', table_name;
    end if;
  end loop;
end
$$;

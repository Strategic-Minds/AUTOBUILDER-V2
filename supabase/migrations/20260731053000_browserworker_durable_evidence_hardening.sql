begin;

-- BrowserWorker durable leases are server-only. The current SECURITY DEFINER
-- functions existed before this migration but were executable by public roles.
revoke all on function public.xai_acquire_factory_lease(text, text, integer) from public, anon, authenticated;
revoke all on function public.xai_renew_factory_lease(text, text, integer) from public, anon, authenticated;
revoke all on function public.xai_release_factory_lease(text, text) from public, anon, authenticated;

grant execute on function public.xai_acquire_factory_lease(text, text, integer) to service_role;
grant execute on function public.xai_renew_factory_lease(text, text, integer) to service_role;
grant execute on function public.xai_release_factory_lease(text, text) to service_role;

alter function public.xai_acquire_factory_lease(text, text, integer) set search_path = public, pg_temp;
alter function public.xai_renew_factory_lease(text, text, integer) set search_path = public, pg_temp;
alter function public.xai_release_factory_lease(text, text) set search_path = public, pg_temp;

alter table public.xai_factory_leases enable row level security;
alter table public.xai_factory_leases force row level security;
revoke all on table public.xai_factory_leases from public, anon, authenticated;
grant select, insert, update, delete on table public.xai_factory_leases to service_role;

alter table public.xab_v3_browser_jobs enable row level security;
alter table public.xab_v3_browser_jobs force row level security;
alter table public.xab_v3_receipts enable row level security;
alter table public.xab_v3_receipts force row level security;
revoke insert, update, delete on table public.xab_v3_browser_jobs from anon, authenticated;
revoke insert, update, delete on table public.xab_v3_receipts from anon, authenticated;
grant select, insert, update, delete on table public.xab_v3_browser_jobs to service_role;
grant select, insert, update, delete on table public.xab_v3_receipts to service_role;

-- Private, content-addressed BrowserWorker evidence. Service-role storage calls
-- bypass bucket RLS; no public read or write policy is created by this migration.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'xab-browser-evidence',
  'xab-browser-evidence',
  false,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'application/json']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    updated_at = now();

create or replace function public.xab_v3_record_browser_validation(
  p_project_id uuid,
  p_correlation_id text,
  p_idempotency_key text,
  p_objective text,
  p_request jsonb,
  p_result jsonb,
  p_passed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job_id uuid;
  v_receipt_id uuid;
  v_state text := case when p_passed then 'completed' else 'failed' end;
begin
  if p_project_id is null then
    raise exception 'project id is required';
  end if;
  if nullif(btrim(p_correlation_id), '') is null then
    raise exception 'correlation id is required';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'idempotency key is required';
  end if;
  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception 'result object is required';
  end if;
  if p_result::text like '%data:image/%' then
    raise exception 'inline screenshot data is prohibited; persist private artifacts first';
  end if;
  if coalesce((p_result #>> '{evidence,durable_artifact_persistence_proven}')::boolean, false) is not true then
    raise exception 'durable browser artifact persistence is required';
  end if;
  if jsonb_array_length(coalesce(p_result #> '{evidence,artifact_refs}', '[]'::jsonb)) < 1 then
    raise exception 'browser artifact references are required';
  end if;
  if nullif(p_result #>> '{evidence,manifest_ref,path}', '') is null then
    raise exception 'browser evidence manifest reference is required';
  end if;

  insert into public.xab_v3_browser_jobs (
    project_id,
    external_job_id,
    correlation_id,
    idempotency_key,
    state,
    objective,
    request,
    result,
    last_error,
    created_at,
    updated_at
  ) values (
    p_project_id,
    p_result ->> 'validation_id',
    p_correlation_id,
    p_idempotency_key,
    v_state,
    coalesce(nullif(btrim(p_objective), ''), 'BrowserWorker validation'),
    coalesce(p_request, '{}'::jsonb),
    p_result,
    case when p_passed then null else coalesce(p_result -> 'errors', '[]'::jsonb)::text end,
    now(),
    now()
  )
  on conflict (idempotency_key) do update
    set correlation_id = excluded.correlation_id,
        state = excluded.state,
        objective = excluded.objective,
        request = excluded.request,
        result = excluded.result,
        last_error = excluded.last_error,
        updated_at = now()
  returning id into v_job_id;

  insert into public.xab_v3_receipts (
    project_id,
    kind,
    passed,
    correlation_id,
    details,
    created_at
  ) values (
    p_project_id,
    'browser_validation',
    p_passed,
    p_correlation_id,
    jsonb_build_object(
      'browser_job_id', v_job_id,
      'validation_id', p_result ->> 'validation_id',
      'evidence_digest', p_result #>> '{evidence,digest}',
      'promotion_eligible', coalesce((p_result #>> '{promotion,promotion_eligible}')::boolean, false),
      'artifact_refs', coalesce(p_result #> '{evidence,artifact_refs}', '[]'::jsonb),
      'manifest_ref', p_result #> '{evidence,manifest_ref}',
      'production_mutation', false
    ),
    now()
  )
  returning id into v_receipt_id;

  return jsonb_build_object(
    'ok', true,
    'browser_job_id', v_job_id,
    'receipt_id', v_receipt_id,
    'correlation_id', p_correlation_id,
    'idempotency_key', p_idempotency_key,
    'production_mutation', false
  );
end;
$$;

revoke all on function public.xab_v3_record_browser_validation(uuid, text, text, text, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.xab_v3_record_browser_validation(uuid, text, text, text, jsonb, jsonb, boolean) to service_role;

commit;

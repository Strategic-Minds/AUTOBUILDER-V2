begin;

alter table public.xab_v3_workflow_jobs
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists lease_token uuid,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists dead_lettered_at timestamptz;

create index if not exists xab_v3_workflow_jobs_claim_idx
  on public.xab_v3_workflow_jobs (state, available_at, lease_expires_at, created_at);

create or replace function public.xab_v3_claim_workflow_job(
  p_worker_id text,
  p_lease_seconds integer default 240
)
returns setof public.xab_v3_workflow_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(btrim(p_worker_id), '') is null then
    raise exception 'worker id is required' using errcode = '22023';
  end if;

  return query
  with candidate as (
    select job.id
    from public.xab_v3_workflow_jobs job
    where job.state = 'queued'
      and coalesce(job.available_at, job.created_at, now()) <= now()
      and coalesce(job.attempts, 0) < coalesce(job.max_attempts, 3)
      and (job.lease_expires_at is null or job.lease_expires_at <= now())
    order by coalesce(job.available_at, job.created_at), job.created_at
    for update skip locked
    limit 1
  )
  update public.xab_v3_workflow_jobs job
  set state = 'running',
      attempts = coalesce(job.attempts, 0) + 1,
      lease_owner = btrim(p_worker_id),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 240), 900))),
      last_heartbeat_at = now(),
      updated_at = now()
  from candidate
  where job.id = candidate.id
  returning job.*;
end;
$$;

create or replace function public.xab_v3_heartbeat_workflow_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer default 240
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed integer;
begin
  update public.xab_v3_workflow_jobs
  set lease_expires_at = now() + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 240), 900))),
      last_heartbeat_at = now(),
      updated_at = now()
  where id = p_job_id
    and lease_token = p_lease_token
    and state = 'running';
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.xab_v3_finish_workflow_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_succeeded boolean,
  p_result jsonb default null,
  p_error text default null,
  p_retry_delay_seconds integer default 30
)
returns setof public.xab_v3_workflow_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  update public.xab_v3_workflow_jobs job
  set state = case
        when p_succeeded then 'completed'
        when coalesce(job.attempts, 0) < coalesce(job.max_attempts, 3) then 'queued'
        else 'failed'
      end,
      result = case when p_succeeded then coalesce(p_result, '{}'::jsonb) else job.result end,
      last_error = case when p_succeeded then null else left(coalesce(p_error, 'workflow job failed'), 1200) end,
      available_at = case
        when not p_succeeded and coalesce(job.attempts, 0) < coalesce(job.max_attempts, 3)
          then now() + make_interval(secs => greatest(0, least(coalesce(p_retry_delay_seconds, 30), 3600)))
        else job.available_at
      end,
      finished_at = case
        when p_succeeded or coalesce(job.attempts, 0) >= coalesce(job.max_attempts, 3) then now()
        else null
      end,
      dead_lettered_at = case
        when not p_succeeded and coalesce(job.attempts, 0) >= coalesce(job.max_attempts, 3) then now()
        else null
      end,
      lease_owner = null,
      lease_token = null,
      lease_expires_at = null,
      last_heartbeat_at = null,
      updated_at = now()
  where job.id = p_job_id
    and job.lease_token = p_lease_token
    and job.state = 'running'
  returning job.*;
end;
$$;

create or replace function public.xab_v3_approve_option(
  p_project_id uuid,
  p_kind text,
  p_option integer,
  p_comment text,
  p_actor text,
  p_owner_email text,
  p_test_auto_approval boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  project_row public.xab_v3_projects%rowtype;
  approval_row public.xab_v3_approval_requests%rowtype;
  downstream_job_id uuid;
  selected_exists boolean;
  approved_at timestamptz := now();
begin
  if p_kind not in ('logo', 'website') then
    raise exception 'approval kind must be logo or website' using errcode = '22023';
  end if;
  if p_option < 1 or p_option > 3 then
    raise exception 'approval option must be between 1 and 3' using errcode = '22023';
  end if;
  if nullif(btrim(p_actor), '') is null or nullif(btrim(p_owner_email), '') is null then
    raise exception 'approval actor and owner email are required' using errcode = '22023';
  end if;

  select project.* into project_row
  from public.xab_v3_projects project
  where project.id = p_project_id
    and lower(project.owner_email) = lower(btrim(p_owner_email))
  for update;
  if not found then raise exception 'project not found for owner' using errcode = 'P0002'; end if;

  select request.* into approval_row
  from public.xab_v3_approval_requests request
  where request.project_id = p_project_id
    and request.kind = p_kind
    and request.state = 'pending'
  order by request.created_at desc
  for update
  limit 1;
  if not found then raise exception 'no pending approval exists' using errcode = 'P0002'; end if;

  if p_kind = 'logo' then
    select exists(select 1 from public.xab_v3_logo_options where project_id = p_project_id and option_number = p_option) into selected_exists;
  else
    select exists(select 1 from public.xab_v3_website_options where project_id = p_project_id and option_number = p_option) into selected_exists;
  end if;
  if not selected_exists then raise exception 'selected option does not exist' using errcode = 'P0002'; end if;

  update public.xab_v3_approval_requests
  set state = 'approved', selected_option = p_option, comment = nullif(p_comment, ''),
      confirmed_by = btrim(p_actor), confirmed_at = approved_at, updated_at = approved_at
  where id = approval_row.id;

  insert into public.xab_v3_approval_decisions (approval_id, decision, selected_option, comment, confirmed_by, created_at)
  values (approval_row.id, 'approved', p_option, nullif(p_comment, ''), btrim(p_actor), approved_at);

  if p_kind = 'logo' then
    update public.xab_v3_projects
    set status = 'generating',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('approved_logo_option', p_option, 'logo_approved_at', approved_at, 'test_auto_approval', p_test_auto_approval),
        updated_at = approved_at
    where id = p_project_id;

    insert into public.xab_v3_workflow_jobs (project_id, type, step, idempotency_key, payload, state, available_at)
    values (p_project_id, 'generate_website_options', 'website', 'website:' || p_project_id::text,
      jsonb_build_object('approved_logo_option', p_option, 'test_auto_approval', p_test_auto_approval), 'queued', now())
    on conflict (idempotency_key) do nothing
    returning id into downstream_job_id;
  else
    update public.xab_v3_projects
    set status = 'approved',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('approved_website_option', p_option, 'website_approved_at', approved_at, 'test_auto_approval', p_test_auto_approval),
        updated_at = approved_at
    where id = p_project_id;

    insert into public.xab_v3_workflow_jobs (project_id, type, step, idempotency_key, payload, state, available_at)
    values (p_project_id, 'build_final_system', 'build', 'build:' || p_project_id::text,
      jsonb_build_object('approved_website_option', p_option, 'test_auto_approval', p_test_auto_approval), 'queued', now())
    on conflict (idempotency_key) do nothing
    returning id into downstream_job_id;
  end if;

  insert into public.xab_v3_receipts (project_id, kind, passed, details, created_at)
  values (p_project_id, p_kind || '_approved', true,
    jsonb_build_object('approval_id', approval_row.id, 'selected_option', p_option, 'actor', btrim(p_actor), 'test_auto_approval', p_test_auto_approval, 'downstream_job_id', downstream_job_id, 'production_locked', true), approved_at);

  return jsonb_build_object('approval_id', approval_row.id, 'selected_option', p_option, 'downstream_job_id', downstream_job_id, 'test_auto_approval', p_test_auto_approval, 'production_locked', true);
end;
$$;

revoke all on function public.xab_v3_claim_workflow_job(text, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_approve_option(uuid, text, integer, text, text, text, boolean) from public, anon, authenticated;

grant execute on function public.xab_v3_claim_workflow_job(text, integer) to service_role;
grant execute on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) to service_role;
grant execute on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) to service_role;
grant execute on function public.xab_v3_approve_option(uuid, text, integer, text, text, text, boolean) to service_role;

commit;

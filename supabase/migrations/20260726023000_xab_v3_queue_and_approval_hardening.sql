begin;

-- Additive queue metadata. Existing jobs and states remain intact.
alter table public.xab_v3_workflow_jobs
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists lease_token uuid,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists dead_lettered_at timestamptz;

create index if not exists xab_v3_jobs_atomic_queue_idx
  on public.xab_v3_workflow_jobs (available_at, created_at)
  where state = 'queued';

create index if not exists xab_v3_jobs_expired_lease_idx
  on public.xab_v3_workflow_jobs (lease_expires_at, created_at)
  where state = 'running';

-- Authenticated users may read only projects they own and their child records.
-- All writes remain server-only through the service-role API boundary.
drop policy if exists xab_v3_projects_owner_read on public.xab_v3_projects;
create policy xab_v3_projects_owner_read
  on public.xab_v3_projects
  for select
  to authenticated
  using (lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists xab_v3_logo_options_owner_read on public.xab_v3_logo_options;
create policy xab_v3_logo_options_owner_read
  on public.xab_v3_logo_options
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_logo_options.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_website_options_owner_read on public.xab_v3_website_options;
create policy xab_v3_website_options_owner_read
  on public.xab_v3_website_options
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_website_options.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_approval_requests_owner_read on public.xab_v3_approval_requests;
create policy xab_v3_approval_requests_owner_read
  on public.xab_v3_approval_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_approval_requests.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_approval_decisions_owner_read on public.xab_v3_approval_decisions;
create policy xab_v3_approval_decisions_owner_read
  on public.xab_v3_approval_decisions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_approval_requests request
      join public.xab_v3_projects project on project.id = request.project_id
      where request.id = xab_v3_approval_decisions.approval_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_workflow_jobs_owner_read on public.xab_v3_workflow_jobs;
create policy xab_v3_workflow_jobs_owner_read
  on public.xab_v3_workflow_jobs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_workflow_jobs.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_browser_jobs_owner_read on public.xab_v3_browser_jobs;
create policy xab_v3_browser_jobs_owner_read
  on public.xab_v3_browser_jobs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_browser_jobs.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists xab_v3_receipts_owner_read on public.xab_v3_receipts;
create policy xab_v3_receipts_owner_read
  on public.xab_v3_receipts
  for select
  to authenticated
  using (
    project_id is not null
    and exists (
      select 1
      from public.xab_v3_projects project
      where project.id = xab_v3_receipts.project_id
        and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Atomically claim one queued or expired job. SKIP LOCKED prevents duplicate workers.
create or replace function public.xab_v3_claim_workflow_job(
  p_worker_id text,
  p_lease_seconds integer default 240
)
returns setof public.xab_v3_workflow_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed public.xab_v3_workflow_jobs%rowtype;
  bounded_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 240), 900));
begin
  if nullif(btrim(p_worker_id), '') is null then
    raise exception 'worker id is required' using errcode = '22023';
  end if;

  -- Exhausted queued or abandoned jobs become durable dead letters without
  -- introducing a second queue table or rewriting historical failed jobs.
  update public.xab_v3_workflow_jobs
  set state = 'failed',
      dead_lettered_at = coalesce(dead_lettered_at, now()),
      finished_at = coalesce(finished_at, now()),
      lease_owner = null,
      lease_token = null,
      lease_expires_at = null,
      last_error = coalesce(last_error, 'Maximum attempts exhausted'),
      updated_at = now()
  where state in ('queued', 'running')
    and attempts >= max_attempts
    and (
      state = 'queued'
      or lease_expires_at is null
      or lease_expires_at < now()
    );

  select job.*
  into claimed
  from public.xab_v3_workflow_jobs job
  where job.attempts < job.max_attempts
    and (
      (job.state = 'queued' and job.available_at <= now())
      or
      (job.state = 'running' and (job.lease_expires_at is null or job.lease_expires_at < now()))
    )
  order by job.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.xab_v3_workflow_jobs
  set state = 'running',
      lease_owner = btrim(p_worker_id),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => bounded_lease_seconds),
      last_heartbeat_at = now(),
      attempts = attempts + 1,
      updated_at = now()
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

-- Extend only the lease currently owned by the caller.
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
  touched integer;
  bounded_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 240), 900));
begin
  update public.xab_v3_workflow_jobs
  set lease_expires_at = now() + make_interval(secs => bounded_lease_seconds),
      last_heartbeat_at = now(),
      updated_at = now()
  where id = p_job_id
    and state = 'running'
    and lease_token = p_lease_token;

  get diagnostics touched = row_count;
  return touched = 1;
end;
$$;

-- Complete, retry, or terminally fail a job only when the lease token matches.
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
declare
  current_job public.xab_v3_workflow_jobs%rowtype;
  finished public.xab_v3_workflow_jobs%rowtype;
  retry_delay integer := greatest(0, least(coalesce(p_retry_delay_seconds, 30), 3600));
begin
  select job.*
  into current_job
  from public.xab_v3_workflow_jobs job
  where job.id = p_job_id
    and job.state = 'running'
    and job.lease_token = p_lease_token
  for update;

  if not found then
    raise exception 'job lease is missing, expired, or owned by another worker' using errcode = 'P0001';
  end if;

  if p_succeeded then
    update public.xab_v3_workflow_jobs
    set state = 'completed',
        result = coalesce(p_result, '{}'::jsonb),
        last_error = null,
        lease_owner = null,
        lease_token = null,
        lease_expires_at = null,
        last_heartbeat_at = now(),
        finished_at = now(),
        dead_lettered_at = null,
        updated_at = now()
    where id = p_job_id
    returning * into finished;
  elsif current_job.attempts >= current_job.max_attempts then
    update public.xab_v3_workflow_jobs
    set state = 'failed',
        last_error = left(coalesce(p_error, 'Workflow job failed'), 1200),
        lease_owner = null,
        lease_token = null,
        lease_expires_at = null,
        last_heartbeat_at = now(),
        finished_at = now(),
        dead_lettered_at = now(),
        updated_at = now()
    where id = p_job_id
    returning * into finished;
  else
    update public.xab_v3_workflow_jobs
    set state = 'queued',
        last_error = left(coalesce(p_error, 'Workflow job failed'), 1200),
        available_at = now() + make_interval(secs => retry_delay),
        lease_owner = null,
        lease_token = null,
        lease_expires_at = null,
        last_heartbeat_at = now(),
        updated_at = now()
    where id = p_job_id
    returning * into finished;
  end if;

  return next finished;
end;
$$;

-- Atomically persist an approval and enqueue exactly one downstream stage.
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

  select project.*
  into project_row
  from public.xab_v3_projects project
  where project.id = p_project_id
    and lower(project.owner_email) = lower(btrim(p_owner_email))
  for update;

  if not found then
    raise exception 'project not found for owner' using errcode = 'P0002';
  end if;

  select request.*
  into approval_row
  from public.xab_v3_approval_requests request
  where request.project_id = p_project_id
    and request.kind = p_kind
    and request.state = 'pending'
  order by request.created_at desc
  for update
  limit 1;

  if not found then
    raise exception 'no pending approval exists' using errcode = 'P0002';
  end if;

  if p_kind = 'logo' then
    select exists(
      select 1 from public.xab_v3_logo_options
      where project_id = p_project_id and option_number = p_option
    ) into selected_exists;
  else
    select exists(
      select 1 from public.xab_v3_website_options
      where project_id = p_project_id and option_number = p_option
    ) into selected_exists;
  end if;

  if not selected_exists then
    raise exception 'selected option does not exist' using errcode = 'P0002';
  end if;

  update public.xab_v3_approval_requests
  set state = 'approved',
      selected_option = p_option,
      comment = nullif(p_comment, ''),
      confirmed_by = btrim(p_actor),
      confirmed_at = approved_at,
      updated_at = approved_at
  where id = approval_row.id;

  insert into public.xab_v3_approval_decisions (
    approval_id, decision, selected_option, comment, confirmed_by, created_at
  ) values (
    approval_row.id, 'approved', p_option, nullif(p_comment, ''), btrim(p_actor), approved_at
  );

  if p_kind = 'logo' then
    update public.xab_v3_projects
    set status = 'generating',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'approved_logo_option', p_option,
          'logo_approved_at', approved_at,
          'test_auto_approval', p_test_auto_approval
        ),
        updated_at = approved_at
    where id = p_project_id;

    insert into public.xab_v3_workflow_jobs (
      project_id, type, step, idempotency_key, payload, state, available_at
    ) values (
      p_project_id,
      'generate_website_options',
      'website',
      'website:' || p_project_id::text,
      jsonb_build_object('approved_logo_option', p_option, 'test_auto_approval', p_test_auto_approval),
      'queued',
      now()
    )
    on conflict (idempotency_key) do nothing
    returning id into downstream_job_id;
  else
    update public.xab_v3_projects
    set status = 'approved',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'approved_website_option', p_option,
          'website_approved_at', approved_at,
          'test_auto_approval', p_test_auto_approval
        ),
        updated_at = approved_at
    where id = p_project_id;

    insert into public.xab_v3_workflow_jobs (
      project_id, type, step, idempotency_key, payload, state, available_at
    ) values (
      p_project_id,
      'build_final_system',
      'build',
      'build:' || p_project_id::text,
      jsonb_build_object('approved_website_option', p_option, 'test_auto_approval', p_test_auto_approval),
      'queued',
      now()
    )
    on conflict (idempotency_key) do nothing
    returning id into downstream_job_id;
  end if;

  insert into public.xab_v3_receipts (
    project_id, kind, passed, details, created_at
  ) values (
    p_project_id,
    p_kind || '_approved',
    true,
    jsonb_build_object(
      'approval_id', approval_row.id,
      'selected_option', p_option,
      'actor', btrim(p_actor),
      'test_auto_approval', p_test_auto_approval,
      'downstream_job_id', downstream_job_id,
      'production_locked', true
    ),
    approved_at
  );

  return jsonb_build_object(
    'approval_id', approval_row.id,
    'selected_option', p_option,
    'downstream_job_id', downstream_job_id,
    'test_auto_approval', p_test_auto_approval,
    'production_locked', true
  );
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

begin;

drop trigger if exists xab_v3_reserve_canonical_job_state_trigger
  on public.xab_v3_workflow_jobs;
drop function if exists public.xab_v3_reserve_canonical_job_state();
drop index if exists public.xab_v3_jobs_canonical_queue_idx;
drop index if exists public.xab_v3_jobs_canonical_lease_idx;

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
    and (state = 'queued' or lease_expires_at is null or lease_expires_at < now());

  select job.* into claimed
  from public.xab_v3_workflow_jobs job
  where job.attempts < job.max_attempts
    and (
      (job.state = 'queued' and job.available_at <= now())
      or (job.state = 'running' and (job.lease_expires_at is null or job.lease_expires_at < now()))
    )
  order by job.created_at asc
  for update skip locked
  limit 1;

  if not found then return; end if;

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
  select job.* into current_job
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
    set state = 'completed', result = coalesce(p_result, '{}'::jsonb), last_error = null,
        lease_owner = null, lease_token = null, lease_expires_at = null,
        last_heartbeat_at = now(), finished_at = now(), dead_lettered_at = null, updated_at = now()
    where id = p_job_id returning * into finished;
  elsif current_job.attempts >= current_job.max_attempts then
    update public.xab_v3_workflow_jobs
    set state = 'failed', last_error = left(coalesce(p_error, 'Workflow job failed'), 1200),
        lease_owner = null, lease_token = null, lease_expires_at = null,
        last_heartbeat_at = now(), finished_at = now(), dead_lettered_at = now(), updated_at = now()
    where id = p_job_id returning * into finished;
  else
    update public.xab_v3_workflow_jobs
    set state = 'queued', last_error = left(coalesce(p_error, 'Workflow job failed'), 1200),
        available_at = now() + make_interval(secs => retry_delay), lease_owner = null,
        lease_token = null, lease_expires_at = null, last_heartbeat_at = now(), updated_at = now()
    where id = p_job_id returning * into finished;
  end if;
  return next finished;
end;
$$;

revoke all on function public.xab_v3_claim_workflow_job(text, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.xab_v3_claim_workflow_job(text, integer) to service_role;
grant execute on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) to service_role;
grant execute on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) to service_role;

commit;

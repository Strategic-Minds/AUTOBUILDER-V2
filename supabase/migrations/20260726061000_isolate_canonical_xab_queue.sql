begin;

-- Keep one workflow table while reserving canonical Xtreme AI Builder states.
-- Generic workers that consume `queued` or `running` can no longer rewrite
-- brand, website, build, or validation jobs owned by the canonical factory.
create or replace function public.xab_v3_reserve_canonical_job_state()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.type in (
    'generate_brand_options',
    'generate_website_options',
    'build_final_system',
    'monitor_final_build'
  ) then
    if new.state is null or new.state = 'queued' then
      new.state := 'xab_queued';
    elsif new.state = 'running' then
      new.state := 'xab_running';
    end if;
    new.payload := coalesce(new.payload, '{}'::jsonb)
      || jsonb_build_object('executor', 'xab_factory_v2');
  end if;
  return new;
end;
$$;

drop trigger if exists xab_v3_reserve_canonical_job_state_trigger
  on public.xab_v3_workflow_jobs;
create trigger xab_v3_reserve_canonical_job_state_trigger
before insert on public.xab_v3_workflow_jobs
for each row
execute function public.xab_v3_reserve_canonical_job_state();

create index if not exists xab_v3_jobs_canonical_queue_idx
  on public.xab_v3_workflow_jobs (available_at, created_at)
  where state = 'xab_queued';
create index if not exists xab_v3_jobs_canonical_lease_idx
  on public.xab_v3_workflow_jobs (lease_expires_at, created_at)
  where state = 'xab_running';

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
      last_error = coalesce(last_error, 'Maximum canonical attempts exhausted'),
      updated_at = now()
  where state in ('xab_queued', 'xab_running')
    and attempts >= max_attempts
    and (
      state = 'xab_queued'
      or lease_expires_at is null
      or lease_expires_at < now()
    );

  select job.*
  into claimed
  from public.xab_v3_workflow_jobs job
  where job.attempts < job.max_attempts
    and coalesce(job.payload ->> 'executor', '') = 'xab_factory_v2'
    and (
      (job.state = 'xab_queued' and job.available_at <= now())
      or
      (job.state = 'xab_running' and (job.lease_expires_at is null or job.lease_expires_at < now()))
    )
  order by job.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.xab_v3_workflow_jobs
  set state = 'xab_running',
      lease_owner = 'xab:' || btrim(p_worker_id),
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
    and state = 'xab_running'
    and lease_token = p_lease_token
    and lease_owner like 'xab:%';

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
  select job.*
  into current_job
  from public.xab_v3_workflow_jobs job
  where job.id = p_job_id
    and job.state = 'xab_running'
    and job.lease_token = p_lease_token
    and job.lease_owner like 'xab:%'
  for update;

  if not found then
    raise exception 'canonical job lease is missing, expired, or owned by another worker'
      using errcode = 'P0001';
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
        last_error = left(coalesce(p_error, 'Canonical workflow job failed'), 1200),
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
    set state = 'xab_queued',
        last_error = left(coalesce(p_error, 'Canonical workflow job failed'), 1200),
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

revoke all on function public.xab_v3_reserve_canonical_job_state() from public, anon, authenticated;
revoke all on function public.xab_v3_claim_workflow_job(text, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) from public, anon, authenticated;

grant execute on function public.xab_v3_claim_workflow_job(text, integer) to service_role;
grant execute on function public.xab_v3_heartbeat_workflow_job(uuid, uuid, integer) to service_role;
grant execute on function public.xab_v3_finish_workflow_job(uuid, uuid, boolean, jsonb, text, integer) to service_role;

commit;

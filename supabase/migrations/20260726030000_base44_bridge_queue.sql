begin;

create table if not exists public.xab_base44_bridge_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  project_id text,
  state text not null default 'queued' check (state in ('queued','running','completed','failed','cancelled')),
  message text not null,
  source text not null default 'autobuilder-v2',
  context jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  lease_owner text,
  lease_expires_at timestamptz,
  result jsonb,
  last_error text,
  available_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists xab_base44_bridge_jobs_claim_idx
  on public.xab_base44_bridge_jobs (state, available_at, lease_expires_at, created_at);

create table if not exists public.xab_base44_bridge_receipts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.xab_base44_bridge_jobs(id) on delete cascade,
  job_key text not null,
  passed boolean not null,
  receipt_type text not null default 'base44_github_roundtrip',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists xab_base44_bridge_receipts_job_idx
  on public.xab_base44_bridge_receipts (job_id, created_at desc);

alter table public.xab_base44_bridge_jobs enable row level security;
alter table public.xab_base44_bridge_receipts enable row level security;

revoke all on public.xab_base44_bridge_jobs from public, anon, authenticated;
revoke all on public.xab_base44_bridge_receipts from public, anon, authenticated;
grant all on public.xab_base44_bridge_jobs to service_role;
grant all on public.xab_base44_bridge_receipts to service_role;

create or replace function public.xab_claim_base44_bridge_job(
  p_worker_id text,
  p_lease_seconds integer default 240
)
returns setof public.xab_base44_bridge_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.xab_base44_bridge_jobs%rowtype;
begin
  select * into claimed
  from public.xab_base44_bridge_jobs
  where available_at <= now()
    and attempts < max_attempts
    and (
      state = 'queued'
      or (state = 'running' and lease_expires_at < now())
    )
  order by created_at asc
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update public.xab_base44_bridge_jobs
  set state = 'running',
      attempts = attempts + 1,
      lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 900))),
      updated_at = now(),
      last_error = null
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

create or replace function public.xab_finish_base44_bridge_job(
  p_job_id uuid,
  p_worker_id text,
  p_succeeded boolean,
  p_result jsonb default null,
  p_error text default null,
  p_retry_delay_seconds integer default 60
)
returns public.xab_base44_bridge_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  current_job public.xab_base44_bridge_jobs%rowtype;
  finished public.xab_base44_bridge_jobs%rowtype;
  next_state text;
begin
  select * into current_job
  from public.xab_base44_bridge_jobs
  where id = p_job_id
  for update;

  if current_job.id is null then
    raise exception 'Bridge job not found';
  end if;

  if current_job.lease_owner is distinct from p_worker_id then
    raise exception 'Bridge job lease owner mismatch';
  end if;

  if p_succeeded then
    next_state := 'completed';
  elsif current_job.attempts >= current_job.max_attempts then
    next_state := 'failed';
  else
    next_state := 'queued';
  end if;

  update public.xab_base44_bridge_jobs
  set state = next_state,
      result = case when p_succeeded then coalesce(p_result, '{}'::jsonb) else result end,
      last_error = case when p_succeeded then null else left(coalesce(p_error, 'Unknown bridge failure'), 2000) end,
      available_at = case when next_state = 'queued' then now() + make_interval(secs => greatest(10, p_retry_delay_seconds)) else available_at end,
      completed_at = case when next_state in ('completed','failed') then now() else null end,
      lease_owner = null,
      lease_expires_at = null,
      updated_at = now()
  where id = p_job_id
  returning * into finished;

  return finished;
end;
$$;

revoke all on function public.xab_claim_base44_bridge_job(text, integer) from public, anon, authenticated;
revoke all on function public.xab_finish_base44_bridge_job(uuid, text, boolean, jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.xab_claim_base44_bridge_job(text, integer) to service_role;
grant execute on function public.xab_finish_base44_bridge_job(uuid, text, boolean, jsonb, text, integer) to service_role;

commit;

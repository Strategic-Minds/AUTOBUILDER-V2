create table if not exists public.xro_runs (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null,
  cycle_id text not null unique,
  state text not null check (state in ('queued','running','repairing','validating','completed','failed')),
  score integer not null default 0 check (score between 0 and 100),
  release_gate text not null default 'REPAIR_REQUIRED' check (release_gate in ('REPAIR_REQUIRED','PREVIEW_ACCEPTABLE','PRODUCTION_APPROVAL_REQUIRED')),
  findings jsonb not null default '[]'::jsonb,
  browser_evidence jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.xro_browser_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.xro_runs(id) on delete cascade,
  external_job_id text not null unique,
  viewport text not null check (viewport in ('desktop','tablet','mobile')),
  state text not null check (state in ('queued','running','completed','failed','timed_out')),
  attempt integer not null default 1 check (attempt between 1 and 5),
  request jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.xro_receipts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.xro_runs(id) on delete cascade,
  kind text not null,
  passed boolean not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists xro_runs_mission_created_idx on public.xro_runs (mission_id, created_at desc);
create index if not exists xro_browser_jobs_run_idx on public.xro_browser_jobs (run_id, created_at);
create index if not exists xro_receipts_run_idx on public.xro_receipts (run_id, created_at);

alter table public.xro_runs enable row level security;
alter table public.xro_runs force row level security;
alter table public.xro_browser_jobs enable row level security;
alter table public.xro_browser_jobs force row level security;
alter table public.xro_receipts enable row level security;
alter table public.xro_receipts force row level security;

revoke all on public.xro_runs from anon, authenticated;
revoke all on public.xro_browser_jobs from anon, authenticated;
revoke all on public.xro_receipts from anon, authenticated;
grant select, insert, update, delete on public.xro_runs to service_role;
grant select, insert, update, delete on public.xro_browser_jobs to service_role;
grant select, insert, update, delete on public.xro_receipts to service_role;

drop policy if exists xro_runs_service_role_all on public.xro_runs;
create policy xro_runs_service_role_all on public.xro_runs for all to service_role using (true) with check (true);
drop policy if exists xro_browser_jobs_service_role_all on public.xro_browser_jobs;
create policy xro_browser_jobs_service_role_all on public.xro_browser_jobs for all to service_role using (true) with check (true);
drop policy if exists xro_receipts_service_role_all on public.xro_receipts;
create policy xro_receipts_service_role_all on public.xro_receipts for all to service_role using (true) with check (true);

-- rollback:
-- drop table if exists public.xro_receipts;
-- drop table if exists public.xro_browser_jobs;
-- drop table if exists public.xro_runs;
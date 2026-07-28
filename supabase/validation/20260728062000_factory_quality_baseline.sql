create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

create table public.factory_repair_jobs (
  id uuid primary key default gen_random_uuid(),
  repair_id text not null unique default ('REP-'::text || substr((gen_random_uuid())::text, 1, 8)),
  job_id text,
  mission_id text,
  failure_fingerprint text not null,
  defect_description text not null,
  repair_strategy text,
  status text default 'pending'::text,
  attempt_count integer default 0,
  max_attempts integer default 3,
  repair_branch text,
  repair_pr_url text,
  patch_applied boolean default false,
  regression_passed boolean,
  assigned_agent text,
  evidence jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table public.factory_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_id text not null unique default ('RCP-'::text || substr((gen_random_uuid())::text, 1, 8)),
  job_id text,
  mission_id text,
  receipt_type text not null,
  status text not null,
  produced_by text not null,
  action_summary text not null,
  evidence jsonb default '{}'::jsonb,
  rollback_available boolean default false,
  rollback_ref text,
  duration_ms integer,
  created_at timestamptz default now()
);

create table public.auto_heal_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  job_id text,
  iteration integer default 1,
  diagnosis text,
  status text default 'in_progress'::text,
  blockers jsonb default '[]'::jsonb,
  actions_taken text[] default '{}'::text[],
  evidence jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Reproduce the currently observed broad access state so the migration proves
-- that it removes anonymous and authenticated access from these internal tables.
grant all privileges on public.factory_repair_jobs to anon, authenticated, service_role;
grant all privileges on public.factory_receipts to anon, authenticated, service_role;
grant all privileges on public.auto_heal_runs to anon, authenticated, service_role;

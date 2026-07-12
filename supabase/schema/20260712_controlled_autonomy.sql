-- AUTOBUILDER-V2 controlled autonomy ledger
-- Staged migration only. Apply after preview review.

create table if not exists public.autonomous_builds (
  id uuid primary key default gen_random_uuid(),
  run_id text unique not null,
  idempotency_key text unique not null,
  title text not null,
  mission text not null,
  status text not null default 'queued' check (status in ('queued','running','paused','needs_input','failed','cancelled','complete')),
  stage text not null default 'intake',
  progress integer not null default 0 check (progress between 0 and 100),
  requested_outputs jsonb not null default '[]'::jsonb,
  source_manifest jsonb not null default '{}'::jsonb,
  browser_mode text not null default 'auto' check (browser_mode in ('auto','headless','headful')),
  max_concurrency integer not null default 8 check (max_concurrency between 1 and 32),
  upstream_run_id text,
  github_repo_url text,
  github_branch text,
  github_pr_url text,
  vercel_project_id text,
  vercel_project_url text,
  preview_url text,
  validation_score numeric,
  artifact_manifest jsonb not null default '[]'::jsonb,
  retry_count integer not null default 0,
  last_error text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.autonomous_build_events (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.autonomous_builds(id) on delete cascade,
  event_type text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.autonomy_ingestion_manifests (
  id uuid primary key default gen_random_uuid(),
  build_id uuid references public.autonomous_builds(id) on delete cascade,
  title text not null,
  status text not null default 'queued',
  source_count integer not null default 0,
  processed_count integer not null default 0,
  failed_count integer not null default 0,
  sources jsonb not null default '[]'::jsonb,
  output_manifest jsonb not null default '{}'::jsonb,
  last_error text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.autonomy_browser_sessions (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.autonomous_builds(id) on delete cascade,
  mode text not null check (mode in ('headless','headful')),
  status text not null default 'queued',
  worker_session_id text,
  live_session_url text,
  trace_url text,
  screenshot_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.autonomy_completed_projects (
  id uuid primary key default gen_random_uuid(),
  build_id uuid unique not null references public.autonomous_builds(id) on delete cascade,
  github_repo_url text not null,
  github_pr_url text,
  vercel_project_url text not null,
  preview_url text not null,
  validation_score numeric,
  artifact_manifest jsonb not null default '[]'::jsonb,
  completion_receipt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists autonomous_builds_status_idx on public.autonomous_builds(status, updated_at);
create index if not exists autonomous_build_events_build_idx on public.autonomous_build_events(build_id, created_at desc);
create index if not exists autonomy_ingestion_build_idx on public.autonomy_ingestion_manifests(build_id, created_at desc);
create index if not exists autonomy_browser_build_idx on public.autonomy_browser_sessions(build_id, created_at desc);

alter table public.autonomous_builds enable row level security;
alter table public.autonomous_build_events enable row level security;
alter table public.autonomy_ingestion_manifests enable row level security;
alter table public.autonomy_browser_sessions enable row level security;
alter table public.autonomy_completed_projects enable row level security;

-- Service-role workers bypass RLS. Authenticated dashboard users receive read-only visibility.
do $$ begin
  create policy "authenticated read autonomous builds" on public.autonomous_builds for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read autonomy events" on public.autonomous_build_events for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read ingestion manifests" on public.autonomy_ingestion_manifests for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read browser sessions" on public.autonomy_browser_sessions for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated read completed projects" on public.autonomy_completed_projects for select to authenticated using (true);
exception when duplicate_object then null; end $$;

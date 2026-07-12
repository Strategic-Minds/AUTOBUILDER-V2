-- AUTO BUILDER V2 autonomous parallel swarm persistence reference
create extension if not exists pgcrypto;

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  project_key text not null,
  title text not null,
  mission text not null,
  requested_outputs jsonb not null default '[]'::jsonb,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  priority integer not null default 50,
  status text not null default 'IDEA_RECEIVED',
  created_by text,
  run_id uuid,
  completed_project_id uuid,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists swarm_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  idea_id uuid references ideas(id) on delete set null,
  project_key text not null,
  mission text not null,
  mode text not null check (mode in ('plan','dry_run','execute')),
  status text not null default 'CREATED',
  root_agent_id uuid,
  max_concurrency integer not null default 8,
  max_agent_depth integer not null default 4,
  openai_response_id text,
  context_snapshot_id uuid,
  result_id uuid,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ideas drop constraint if exists ideas_run_id_fkey;
alter table ideas add constraint ideas_run_id_fkey foreign key (run_id) references swarm_runs(id) on delete set null;

create table if not exists swarm_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  version integer not null,
  context jsonb not null,
  created_at timestamptz not null default now(),
  unique(run_id, version)
);

create table if not exists swarm_agents (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  parent_agent_id uuid references swarm_agents(id),
  agent_path text not null,
  role_key text not null,
  task_packet_id uuid,
  context_snapshot_id uuid references swarm_context_snapshots(id),
  status text not null default 'CREATED',
  tool_names jsonb not null default '[]'::jsonb,
  workspace_binding jsonb not null default '{}'::jsonb,
  openai_response_id text,
  openai_agent_metadata jsonb not null default '{}'::jsonb,
  lease_owner text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, agent_path)
);

create table if not exists swarm_task_packets (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  packet_key text not null,
  requirement_ids jsonb not null default '[]'::jsonb,
  title text not null,
  objective text not null,
  owner_role_key text not null,
  assigned_agent_id uuid references swarm_agents(id),
  dependencies jsonb not null default '[]'::jsonb,
  resource_locks jsonb not null default '[]'::jsonb,
  github_binding jsonb,
  vercel_binding jsonb,
  context_snapshot_id uuid references swarm_context_snapshots(id),
  inputs jsonb not null default '{}'::jsonb,
  expected_outputs jsonb not null default '[]'::jsonb,
  acceptance_tests jsonb not null default '[]'::jsonb,
  priority integer not null default 50,
  risk_class text not null default 'LOW',
  attempt integer not null default 0,
  max_attempts integer not null default 3,
  status text not null default 'DRAFT',
  lease_owner text,
  lease_expires_at timestamptz,
  result_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, packet_key)
);

create table if not exists swarm_dependencies (
  packet_id uuid not null references swarm_task_packets(id) on delete cascade,
  depends_on_packet_id uuid not null references swarm_task_packets(id) on delete cascade,
  dependency_type text not null default 'hard',
  created_at timestamptz not null default now(),
  primary key (packet_id, depends_on_packet_id)
);

create table if not exists swarm_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  run_id uuid not null references swarm_runs(id) on delete cascade,
  agent_id uuid references swarm_agents(id),
  packet_id uuid references swarm_task_packets(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists swarm_messages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  author_path text not null,
  recipient_path text not null,
  message_type text not null,
  payload jsonb not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists swarm_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  packet_id uuid references swarm_task_packets(id),
  agent_id uuid references swarm_agents(id),
  status text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists swarm_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  packet_id uuid references swarm_task_packets(id),
  artifact_type text not null,
  name text not null,
  uri text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists swarm_receipts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references swarm_runs(id) on delete cascade,
  packet_id uuid references swarm_task_packets(id),
  receipt_type text not null,
  status text not null,
  evidence jsonb not null default '{}'::jsonb,
  rollback_ref text,
  created_at timestamptz not null default now()
);

create table if not exists resource_locks (
  lock_key text primary key,
  run_id uuid not null references swarm_runs(id) on delete cascade,
  packet_id uuid not null references swarm_task_packets(id) on delete cascade,
  lock_mode text not null default 'write',
  lease_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists github_installations (
  installation_id bigint primary key,
  account_login text not null,
  account_type text not null,
  accessible boolean not null default true,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists github_repository_registry (
  repository_id bigint primary key,
  installation_id bigint not null references github_installations(installation_id),
  owner_login text not null,
  name text not null,
  full_name text not null unique,
  visibility text,
  default_branch text,
  archived boolean not null default false,
  accessible boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  clone_url text,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists vercel_team_registry (
  team_id text primary key,
  name text not null,
  slug text not null,
  accessible boolean not null default true,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists vercel_project_registry (
  project_id text primary key,
  team_id text not null references vercel_team_registry(team_id),
  name text not null,
  framework text,
  root_directory text,
  github_repository_id bigint references github_repository_registry(repository_id),
  accessible boolean not null default true,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(team_id, name)
);

create table if not exists completed_projects (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references ideas(id) on delete cascade,
  run_id uuid not null unique references swarm_runs(id) on delete cascade,
  project_name text not null,
  status text not null check (status in ('COMPLETE','PARTIAL','FAILED','NEEDS_INPUT','CANCELLED')),
  github_repository_id bigint references github_repository_registry(repository_id),
  github_repository_full_name text,
  github_branch text,
  github_pull_request_url text,
  vercel_project_id text references vercel_project_registry(project_id),
  vercel_project_name text,
  deployment_url text,
  validation_status text,
  validation_score numeric,
  artifact_refs jsonb not null default '[]'::jsonb,
  receipt_refs jsonb not null default '[]'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ideas drop constraint if exists ideas_completed_project_id_fkey;
alter table ideas add constraint ideas_completed_project_id_fkey foreign key (completed_project_id) references completed_projects(id) on delete set null;

create index if not exists idx_ideas_status_priority on ideas(status, priority desc, created_at);
create index if not exists idx_swarm_packets_dispatch on swarm_task_packets(status, priority desc, created_at);
create index if not exists idx_swarm_packets_lease on swarm_task_packets(lease_expires_at) where lease_expires_at is not null;
create index if not exists idx_swarm_events_run on swarm_events(run_id, created_at);
create index if not exists idx_swarm_agents_run on swarm_agents(run_id, agent_path);
create index if not exists idx_repo_installation on github_repository_registry(installation_id, full_name);
create index if not exists idx_vercel_team on vercel_project_registry(team_id, name);
create index if not exists idx_completed_projects_status on completed_projects(status, completed_at desc);
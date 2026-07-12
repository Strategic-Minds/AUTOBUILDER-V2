-- AUTO_BUILDER Master OS core schema
create extension if not exists vector;

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  agent_key text unique not null,
  display_name text not null,
  agent_type text not null,
  status text not null default 'draft',
  allowed_actions jsonb not null default '[]',
  gated_actions jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  from_agent text,
  to_agent text,
  message_type text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued',
  created_at timestamptz default now()
);

create table if not exists swarm_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text unique not null,
  phase text not null,
  owner_agent text,
  status text not null default 'planned',
  score numeric default 0,
  max_score numeric default 100,
  payload jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  task_key text not null,
  gate text not null,
  requested_by text,
  status text not null default 'pending',
  approved_by text,
  approval_text text,
  created_at timestamptz default now(),
  decided_at timestamptz
);

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  task_key text,
  receipt_type text not null,
  status text not null,
  score numeric,
  evidence jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists intelligence_sources (
  id uuid primary key default gen_random_uuid(),
  library text not null,
  source_type text not null,
  url text,
  title text,
  confidence numeric default 0.5,
  status text not null default 'new',
  created_at timestamptz default now()
);

create table if not exists intelligence_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references intelligence_sources(id) on delete cascade,
  chunk_text text not null,
  tags text[] default '{}',
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists qa_scores (
  id uuid primary key default gen_random_uuid(),
  task_key text not null,
  category text not null,
  score numeric not null,
  max_score numeric not null default 100,
  blockers jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists auto_heal_runs (
  id uuid primary key default gen_random_uuid(),
  task_key text not null,
  iteration int not null,
  input_score numeric,
  output_score numeric,
  patch_summary text,
  status text not null default 'draft',
  created_at timestamptz default now()
);

create table if not exists template_registry (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  template_type text not null,
  industry_scope text not null default 'universal',
  version text not null default '0.1.0',
  status text not null default 'draft',
  manifest jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table agents enable row level security;
alter table agent_messages enable row level security;
alter table swarm_tasks enable row level security;
alter table approvals enable row level security;
alter table receipts enable row level security;
alter table intelligence_sources enable row level security;
alter table intelligence_chunks enable row level security;
alter table qa_scores enable row level security;
alter table auto_heal_runs enable row level security;
alter table template_registry enable row level security;

-- Placeholder policies. Replace with project-specific auth rules before applying live.
create policy if not exists "service role full agents" on agents for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "service role full messages" on agent_messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "service role full tasks" on swarm_tasks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "service role full approvals" on approvals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "service role full receipts" on receipts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

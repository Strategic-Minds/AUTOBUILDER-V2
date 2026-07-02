-- AUTO_BUILDER Enterprise Final Ops, WhatsApp, Consent, Observability
-- Review before apply. Do not run in production without approval.

create table if not exists communication_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  channel text not null,
  provider text not null,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_senders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  provider text not null,
  phone_number text not null,
  waba_id text,
  sender_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  template_key text not null,
  provider text not null,
  provider_template_id text,
  category text,
  language text default 'en_US',
  status text not null default 'draft',
  variables jsonb not null default '[]'::jsonb,
  body_example text,
  created_at timestamptz not null default now()
);

create table if not exists consent_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  contact_id uuid,
  channel text not null,
  consent_status text not null,
  source text,
  consent_text text,
  proof_url text,
  ip_address text,
  user_agent text,
  jurisdiction text,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists message_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  contact_id uuid,
  channel text not null,
  provider text,
  status text not null default 'open',
  assigned_agent_id uuid,
  assigned_human_email text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists message_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  thread_id uuid,
  direction text not null,
  channel text not null,
  provider text,
  provider_message_id text,
  from_address text,
  to_address text,
  message_type text,
  body text,
  status text not null default 'received',
  consent_checked boolean default false,
  template_checked boolean default false,
  approval_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists human_escalations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  thread_id uuid,
  reason text not null,
  severity text not null default 'medium',
  assigned_to_email text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists observability_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  run_id text,
  request_id text,
  trace_id text,
  agent_id uuid,
  event_type text not null,
  status text not null,
  cost_estimate numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists budget_limits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  scope text not null,
  period text not null,
  amount numeric not null,
  currency text not null default 'USD',
  hard_stop boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists incident_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  severity text not null,
  title text not null,
  description text,
  status text not null default 'open',
  owner_email text,
  receipt_id uuid,
  created_at timestamptz not null default now()
);

alter table communication_channels enable row level security;
alter table whatsapp_senders enable row level security;
alter table whatsapp_templates enable row level security;
alter table consent_ledger enable row level security;
alter table message_threads enable row level security;
alter table message_events enable row level security;
alter table human_escalations enable row level security;
alter table observability_events enable row level security;
alter table budget_limits enable row level security;
alter table incident_reports enable row level security;

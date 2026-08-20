begin;

-- AUTONOMOUS BACKLOG ENGINE V1
-- REVIEWED MIGRATION PACKET. DO NOT APPLY TO PRODUCTION WITHOUT:
-- 1. an isolated Supabase branch or equivalent staging database,
-- 2. successful unit/release validation and rollback receipts,
-- 3. a Supabase security-advisor review,
-- 4. explicit operator approval for the production database change.

create extension if not exists pgcrypto;

create table if not exists public.backlog_customers (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null unique,
  name text not null,
  trade text not null,
  market text,
  target_gross_margin numeric(7,4),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backlog_opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null references public.backlog_customers(customer_key) on update cascade,
  source_type text not null,
  source_id text not null,
  source_url text,
  title text not null,
  trade text,
  market text,
  geography jsonb not null default '{}'::jsonb,
  bid_due_at timestamptz,
  estimated_contract_value numeric(16,2) not null default 0 check (estimated_contract_value >= 0),
  estimated_gross_margin numeric(7,4) not null default 0 check (estimated_gross_margin between 0 and 1),
  probability_of_award numeric(7,4) not null default 0 check (probability_of_award between 0 and 1),
  strategic_fit numeric(7,4) not null default 0 check (strategic_fit between 0 and 1),
  confidence numeric(7,4) not null default 0 check (confidence between 0 and 1),
  reusability numeric(7,4) not null default 1 check (reusability between 0 and 1),
  estimated_pursuit_cost numeric(16,2) not null default 1 check (estimated_pursuit_cost >= 0),
  risk_factor numeric(7,4) not null default 1 check (risk_factor > 0),
  expected_gross_profit numeric(16,2) not null default 0,
  value_score numeric(8,2) not null default 0 check (value_score between 0 and 100),
  status text not null default 'discovered' check (status in ('discovered','qualified','bid_ready','submitted','won','lost','withdrawn','archived')),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_key, source_type, source_id)
);

create table if not exists public.backlog_bids (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null references public.backlog_customers(customer_key) on update cascade,
  opportunity_id uuid not null references public.backlog_opportunities(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','bid_ready','approval_required','approved','submitted','withdrawn','won','lost')),
  proposed_price numeric(16,2),
  estimated_gross_margin numeric(7,4),
  approval_receipt_id text,
  approved_by text,
  approved_at timestamptz,
  submitted_at timestamptz,
  submission_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backlog_outcomes (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null references public.backlog_customers(customer_key) on update cascade,
  opportunity_id uuid not null references public.backlog_opportunities(id) on delete restrict,
  bid_id uuid references public.backlog_bids(id) on delete set null,
  result text not null check (result in ('won','lost','withdrawn','unknown')),
  awarded_contract_value numeric(16,2),
  estimated_gross_profit numeric(16,2),
  realized_revenue numeric(16,2),
  realized_cost numeric(16,2),
  realized_gross_profit numeric(16,2),
  award_evidence jsonb not null default '{}'::jsonb,
  financial_evidence jsonb not null default '{}'::jsonb,
  lesson jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists public.backlog_economic_attribution_events (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null references public.backlog_customers(customer_key) on update cascade,
  opportunity_id uuid references public.backlog_opportunities(id) on delete set null,
  bid_id uuid references public.backlog_bids(id) on delete set null,
  event_type text not null,
  amount numeric(16,2),
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.backlog_execution_leases (
  id uuid primary key default gen_random_uuid(),
  lease_token uuid not null default gen_random_uuid(),
  system_id text not null,
  cycle_key text not null,
  holder text not null,
  state text not null default 'running' check (state in ('running','completed','failed')),
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  unique (system_id, cycle_key)
);

create table if not exists public.backlog_improvement_runs (
  id uuid primary key default gen_random_uuid(),
  system_id text not null,
  cycle_key text not null,
  worker_id text not null,
  customer_key text references public.backlog_customers(customer_key) on update cascade,
  selected_opportunity_id uuid references public.backlog_opportunities(id) on delete set null,
  objective text not null,
  state text not null check (state in ('running','completed','failed','approval_required','rejected','quarantined')),
  baseline jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  production_locked boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (system_id, cycle_key)
);

create table if not exists public.backlog_validation_receipts (
  id uuid primary key default gen_random_uuid(),
  improvement_run_id uuid references public.backlog_improvement_runs(id) on delete cascade,
  customer_key text references public.backlog_customers(customer_key) on update cascade,
  provider text not null check (provider in ('BrowserWorker','CloudBrowser','unit','release','operator')),
  kind text not null,
  passed boolean not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists backlog_opportunities_customer_status_due_idx on public.backlog_opportunities(customer_key, status, bid_due_at);
create index if not exists backlog_opportunities_value_idx on public.backlog_opportunities(value_score desc, updated_at desc);
create index if not exists backlog_bids_opportunity_idx on public.backlog_bids(opportunity_id, created_at desc);
create index if not exists backlog_outcomes_customer_idx on public.backlog_outcomes(customer_key, recorded_at desc);
create index if not exists backlog_attribution_customer_idx on public.backlog_economic_attribution_events(customer_key, occurred_at desc);
create index if not exists backlog_leases_system_completed_idx on public.backlog_execution_leases(system_id, completed_at desc);

alter table public.backlog_customers enable row level security;
alter table public.backlog_opportunities enable row level security;
alter table public.backlog_bids enable row level security;
alter table public.backlog_outcomes enable row level security;
alter table public.backlog_economic_attribution_events enable row level security;
alter table public.backlog_execution_leases enable row level security;
alter table public.backlog_improvement_runs enable row level security;
alter table public.backlog_validation_receipts enable row level security;

revoke all on public.backlog_customers from public, anon, authenticated;
revoke all on public.backlog_opportunities from public, anon, authenticated;
revoke all on public.backlog_bids from public, anon, authenticated;
revoke all on public.backlog_outcomes from public, anon, authenticated;
revoke all on public.backlog_economic_attribution_events from public, anon, authenticated;
revoke all on public.backlog_execution_leases from public, anon, authenticated;
revoke all on public.backlog_improvement_runs from public, anon, authenticated;
revoke all on public.backlog_validation_receipts from public, anon, authenticated;

grant select, insert, update, delete on public.backlog_customers to service_role;
grant select, insert, update, delete on public.backlog_opportunities to service_role;
grant select, insert, update, delete on public.backlog_bids to service_role;
grant select, insert, update, delete on public.backlog_outcomes to service_role;
grant select, insert, update, delete on public.backlog_economic_attribution_events to service_role;
grant select, insert, update, delete on public.backlog_execution_leases to service_role;
grant select, insert, update, delete on public.backlog_improvement_runs to service_role;
grant select, insert, update, delete on public.backlog_validation_receipts to service_role;

create or replace function public.backlog_claim_hourly_lease(p_system_id text, p_worker_id text, p_cycle_key text, p_lease_seconds integer default 3300)
returns setof public.backlog_execution_leases
language plpgsql
security definer
set search_path = public
as $$
declare claimed public.backlog_execution_leases;
begin
  insert into public.backlog_execution_leases(system_id, cycle_key, holder, state, acquired_at, expires_at)
  values (p_system_id, p_cycle_key, p_worker_id, 'running', now(), now() + make_interval(secs => greatest(60, least(p_lease_seconds, 3600))))
  on conflict (system_id, cycle_key) do update
    set holder = excluded.holder, lease_token = gen_random_uuid(), state = 'running', acquired_at = now(), expires_at = excluded.expires_at, completed_at = null, result = '{}'::jsonb
  where public.backlog_execution_leases.state = 'failed'
     or (public.backlog_execution_leases.state = 'running' and public.backlog_execution_leases.expires_at <= now())
  returning * into claimed;
  if claimed.id is not null then return next claimed; end if;
  return;
end;
$$;

create or replace function public.backlog_finish_hourly_lease(p_lease_id uuid, p_lease_token uuid, p_state text, p_result jsonb default '{}'::jsonb)
returns setof public.backlog_execution_leases
language plpgsql
security definer
set search_path = public
as $$
declare finished public.backlog_execution_leases;
begin
  if p_state not in ('completed','failed') then raise exception 'invalid backlog lease terminal state'; end if;
  update public.backlog_execution_leases
     set state = p_state, completed_at = now(), result = coalesce(p_result, '{}'::jsonb)
   where id = p_lease_id and lease_token = p_lease_token and state = 'running'
  returning * into finished;
  if finished.id is not null then return next finished; end if;
  return;
end;
$$;

revoke all on function public.backlog_claim_hourly_lease(text,text,text,integer) from public, anon, authenticated;
revoke all on function public.backlog_finish_hourly_lease(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.backlog_claim_hourly_lease(text,text,text,integer) to service_role;
grant execute on function public.backlog_finish_hourly_lease(uuid,uuid,text,jsonb) to service_role;

comment on table public.backlog_opportunities is 'Service-role-only opportunity evidence scored for profitable customer backlog generation.';
comment on table public.backlog_execution_leases is 'Idempotent hourly lease used by the existing five-minute AUTO BUILDER cron.';
comment on table public.backlog_improvement_runs is 'Bounded hourly economic improvement recommendations; production remains locked.';

commit;

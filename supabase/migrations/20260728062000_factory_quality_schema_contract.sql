begin;

-- REVIEWED MIGRATION PACKET. DO NOT APPLY TO PRODUCTION WITHOUT:
-- 1. an isolated Supabase branch or equivalent staging database,
-- 2. successful adapter and rollback receipts,
-- 3. a security-advisor review,
-- 4. explicit operator approval for the database change.
--
-- This migration reconciles the deployed factory schema with the production
-- adapters. It is additive except for enabling service-role-only RLS on three
-- factory-internal tables that currently have no browser clients in this repo.

create table if not exists public.factory_quality_findings (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  category text,
  severity text not null default 'info'
    check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  description text,
  source text,
  auto_fixable boolean not null default false,
  fix_applied boolean not null default false,
  fix_recipe jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.factory_quality_scores (
  id uuid primary key default gen_random_uuid(),
  score_id text not null unique,
  project_id text not null,
  score_type text not null default 'composite',
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  grade text not null check (grade in ('A', 'B', 'C', 'F')),
  checked_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

alter table public.factory_repair_jobs
  add column if not exists project_id text,
  add column if not exists finding_id uuid,
  add column if not exists repair_type text,
  add column if not exists recipe jsonb not null default '{}'::jsonb;

alter table public.auto_heal_runs
  add column if not exists patch_branch text;

create unique index if not exists factory_repair_jobs_finding_active_idx
  on public.factory_repair_jobs(finding_id)
  where finding_id is not null
    and lower(coalesce(status, 'pending')) not in ('completed', 'cancelled', 'superseded', 'failed');

create index if not exists factory_quality_findings_project_open_idx
  on public.factory_quality_findings(project_id, created_at desc)
  where resolved_at is null;

create index if not exists factory_quality_findings_autofix_idx
  on public.factory_quality_findings(created_at)
  where auto_fixable = true and fix_applied = false and resolved_at is null;

create index if not exists factory_quality_scores_project_idx
  on public.factory_quality_scores(project_id, checked_at desc);

create index if not exists auto_heal_runs_project_iteration_idx
  on public.auto_heal_runs(project_id, iteration desc);

alter table public.factory_quality_findings enable row level security;
alter table public.factory_quality_scores enable row level security;
alter table public.factory_repair_jobs enable row level security;
alter table public.factory_receipts enable row level security;
alter table public.auto_heal_runs enable row level security;

revoke all on public.factory_quality_findings from public, anon, authenticated;
revoke all on public.factory_quality_scores from public, anon, authenticated;
revoke all on public.factory_repair_jobs from public, anon, authenticated;
revoke all on public.factory_receipts from public, anon, authenticated;
revoke all on public.auto_heal_runs from public, anon, authenticated;

grant select, insert, update, delete on public.factory_quality_findings to service_role;
grant select, insert, update, delete on public.factory_quality_scores to service_role;
grant select, insert, update, delete on public.factory_repair_jobs to service_role;
grant select, insert, update, delete on public.factory_receipts to service_role;
grant select, insert, update, delete on public.auto_heal_runs to service_role;

comment on table public.factory_quality_findings is
  'Service-role-only quality findings consumed by the governed reflect/fix/heal loop.';
comment on table public.factory_quality_scores is
  'Service-role-only computed quality scores and grading receipts.';
comment on column public.factory_repair_jobs.finding_id is
  'Optional link to factory_quality_findings.id for deterministic repair idempotency.';

commit;

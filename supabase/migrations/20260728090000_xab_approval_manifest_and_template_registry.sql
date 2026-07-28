begin;

-- BRANCH-ONLY MIGRATION. DO NOT APPLY TO PRODUCTION WITHOUT AN ISOLATED
-- Supabase branch, validation receipts, security advisors, and operator approval.

create table if not exists public.xab_v3_approval_manifests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.xab_v3_projects(id) on delete cascade,
  schema_version text not null default 'xab.approval-manifest.v1',
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  manifest jsonb not null,
  approved_by text not null,
  approved_at timestamptz not null default now(),
  immutable boolean not null default true check (immutable = true),
  created_at timestamptz not null default now(),
  unique (project_id, manifest_sha256)
);

create table if not exists public.xab_v3_template_systems (
  id uuid primary key default gen_random_uuid(),
  template_slug text not null unique,
  repository text not null,
  sandbox_repository text not null,
  vercel_project text,
  drive_folder_id text,
  status text not null default 'read_only',
  mutation_policy text not null default 'copy_or_branch_generated_output_only',
  manifest jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('read_only', 'maintenance', 'blocked', 'archived'))
);

create or replace function public.xab_v3_prevent_approval_manifest_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'Approved XAB manifests are immutable; create a new version instead'
    using errcode = '55000';
end;
$$;

drop trigger if exists xab_v3_approval_manifest_immutable_update on public.xab_v3_approval_manifests;
create trigger xab_v3_approval_manifest_immutable_update
before update or delete on public.xab_v3_approval_manifests
for each row execute function public.xab_v3_prevent_approval_manifest_mutation();

alter table public.xab_v3_approval_manifests enable row level security;
alter table public.xab_v3_template_systems enable row level security;

revoke all on public.xab_v3_approval_manifests from public, anon, authenticated;
revoke all on public.xab_v3_template_systems from public, anon, authenticated;
revoke all on function public.xab_v3_prevent_approval_manifest_mutation() from public, anon, authenticated;

grant select, insert on public.xab_v3_approval_manifests to service_role;
grant select, insert, update on public.xab_v3_template_systems to service_role;

-- Owner-readable manifests. Service-role execution bypasses RLS and remains the
-- only writer. This policy assumes project ownership is stored in owner_email.
drop policy if exists xab_v3_approval_manifests_owner_read on public.xab_v3_approval_manifests;
create policy xab_v3_approval_manifests_owner_read
on public.xab_v3_approval_manifests
for select
to authenticated
using (
  exists (
    select 1
    from public.xab_v3_projects project
    where project.id = project_id
      and lower(project.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Template metadata is readable to authenticated operators but not writable.
drop policy if exists xab_v3_template_systems_authenticated_read on public.xab_v3_template_systems;
create policy xab_v3_template_systems_authenticated_read
on public.xab_v3_template_systems
for select
to authenticated
using (true);

create index if not exists xab_v3_approval_manifests_project_idx
  on public.xab_v3_approval_manifests(project_id, approved_at desc);

insert into public.xab_v3_template_systems (
  template_slug,
  repository,
  sandbox_repository,
  vercel_project,
  status,
  mutation_policy,
  manifest,
  last_verified_at
) values (
  'uacs',
  'Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM',
  'Strategic-Minds/UNIVERSAL-AUTONOMOUS-CODING-SYSTEM-SANDBOX',
  'uacs-autonomous-sandbox',
  'read_only',
  'copy_or_branch_generated_output_only',
  jsonb_build_object(
    'command_authority', 'Strategic-Minds/XAB',
    'executor', 'Strategic-Minds/AUTOBUILDER-V2',
    'validator', 'Strategic-Minds/BROWSERWORKER',
    'production_default', true,
    'preview_role', 'intermediate_validation_stage',
    'promotion_policy', 'production_after_mandatory_evidence',
    'visual_parity_each_breakpoint', 99,
    'operational_parity', 100
  ),
  now()
)
on conflict (template_slug) do update set
  repository = excluded.repository,
  sandbox_repository = excluded.sandbox_repository,
  vercel_project = excluded.vercel_project,
  status = excluded.status,
  mutation_policy = excluded.mutation_policy,
  manifest = excluded.manifest,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();

commit;

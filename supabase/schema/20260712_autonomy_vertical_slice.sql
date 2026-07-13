-- AUTOBUILDER-V2 controlled autonomy vertical slice
-- Staged migration. Apply only after preview review.

create extension if not exists pgcrypto;

create table if not exists public.autonomous_builds (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  title text not null,
  mission text not null,
  requested_outputs jsonb not null default '[]'::jsonb,
  source_manifest jsonb not null default '{}'::jsonb,
  browser_mode text not null default 'auto' check (browser_mode in ('auto','headless','headful')),
  max_concurrency integer not null default 8 check (max_concurrency between 1 and 32),
  priority integer not null default 5 check (priority between 1 and 10),
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','PAUSED','NEEDS_INPUT','FAILED','CANCELLED','COMPLETE')),
  current_stage text not null default 'INTAKE',
  progress integer not null default 5 check (progress between 0 and 100),
  upstream_run_id text,
  upstream_status jsonb not null default '{}'::jsonb,
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
  build_id uuid not null references public.autonomous_builds(id) on delete cascade,
  title text not null,
  status text not null default 'QUEUED',
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

create table if not exists public.autonomy_completed_projects (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null unique references public.autonomous_builds(id) on delete cascade,
  title text not null,
  github_repo_url text not null,
  github_pr_url text,
  vercel_project_id text not null,
  preview_url text not null,
  validation_score numeric,
  artifact_manifest jsonb not null default '[]'::jsonb,
  completion_summary jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists autonomous_builds_status_idx on public.autonomous_builds(status, priority, created_at);
create index if not exists autonomous_build_events_build_idx on public.autonomous_build_events(build_id, created_at desc);
create index if not exists autonomy_ingestion_build_idx on public.autonomy_ingestion_manifests(build_id, created_at desc);

create or replace function public.submit_autonomous_build(
  p_idempotency_key text,
  p_title text,
  p_mission text,
  p_requested_outputs jsonb,
  p_source_manifest jsonb,
  p_priority integer,
  p_browser_mode text,
  p_max_concurrency integer,
  p_created_by text
) returns jsonb language plpgsql security definer as $$
declare b public.autonomous_builds; j public.factory_jobs; duplicate boolean := false;
begin
  select * into b from public.autonomous_builds where idempotency_key = p_idempotency_key;
  if found then duplicate := true; else
    insert into public.autonomous_builds(idempotency_key,title,mission,requested_outputs,source_manifest,priority,browser_mode,max_concurrency,created_by)
    values(p_idempotency_key,p_title,p_mission,coalesce(p_requested_outputs,'[]'::jsonb),coalesce(p_source_manifest,'{}'::jsonb),greatest(1,least(10,p_priority)),p_browser_mode,greatest(1,least(32,p_max_concurrency)),p_created_by)
    returning * into b;
    insert into public.factory_jobs(job_type,queue_name,title,status,priority,idempotency_key,input_payload)
    values('autonomous-build-root','autonomy',p_title,'queued',b.priority,'autonomous-build:'||b.id,jsonb_build_object('build_id',b.id)) returning * into j;
    insert into public.autonomous_build_events(build_id,event_type,message,data) values(b.id,'autonomy.submitted','Autonomous build accepted.',jsonb_build_object('job_id',j.id));
  end if;
  return jsonb_build_object('build',to_jsonb(b),'job',to_jsonb(j),'duplicate',duplicate);
end $$;

create or replace function public.claim_autonomy_jobs(p_worker_id text, p_limit integer default 4)
returns setof public.factory_jobs language plpgsql security definer as $$
begin
  return query
  with picked as (
    select id from public.factory_jobs
    where queue_name='autonomy'
      and status='queued'
      and job_type in ('autonomous-build-root','autonomous-build-start','autonomous-build-monitor','autonomous-build-finalize','bulk-ingest')
    order by priority asc, created_at asc
    for update skip locked limit greatest(1,least(20,p_limit))
  )
  update public.factory_jobs f set status='leased',lease_owner=p_worker_id,lease_expires_at=now()+interval '4 minutes',attempt_count=coalesce(attempt_count,0)+1
  from picked where f.id=picked.id returning f.*;
end $$;

create or replace function public.cancel_autonomous_build(p_build_id uuid,p_actor_id text)
returns jsonb language plpgsql security definer as $$
declare b public.autonomous_builds;
begin
 update public.autonomous_builds set status='CANCELLED',last_error='cancelled by '||p_actor_id,updated_at=now(),completed_at=now() where id=p_build_id returning * into b;
 update public.factory_jobs set status='failed',attempt_count=max_attempts,lease_owner=null,lease_expires_at=null,last_error='cancelled_by_operator' where queue_name='autonomy' and input_payload->>'build_id'=p_build_id::text and status in ('queued','leased');
 insert into public.autonomous_build_events(build_id,event_type,message,data) values(p_build_id,'autonomy.cancelled','Build cancelled by operator.',jsonb_build_object('actor',p_actor_id));
 return to_jsonb(b);
end $$;

create or replace function public.retry_autonomous_build(p_build_id uuid,p_actor_id text)
returns jsonb language plpgsql security definer as $$
declare b public.autonomous_builds;
begin
 update public.autonomous_builds set status='QUEUED',current_stage='INTAKE',progress=5,retry_count=retry_count+1,last_error=null,completed_at=null,updated_at=now() where id=p_build_id returning * into b;
 insert into public.factory_jobs(job_type,queue_name,title,status,priority,idempotency_key,input_payload)
 values('autonomous-build-root','autonomy','Retry: '||b.title,'queued',b.priority,'autonomous-build-retry:'||b.id||':'||b.retry_count,jsonb_build_object('build_id',b.id));
 insert into public.autonomous_build_events(build_id,event_type,message,data) values(p_build_id,'autonomy.retried','Build retry queued.',jsonb_build_object('actor',p_actor_id,'retry_count',b.retry_count));
 return to_jsonb(b);
end $$;

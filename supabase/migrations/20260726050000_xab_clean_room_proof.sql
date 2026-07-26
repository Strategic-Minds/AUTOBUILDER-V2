begin;

create table if not exists public.xab_clean_room_intakes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 180),
  company text not null default '' check (char_length(company) <= 160),
  service text not null default '' check (char_length(service) <= 160),
  details text not null check (char_length(details) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'active', 'completed')),
  source text not null default 'proof-flow-public-intake' check (char_length(source) <= 120),
  ip_hash text not null check (char_length(ip_hash) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists xab_clean_room_intakes_created_idx
  on public.xab_clean_room_intakes (created_at desc);
create index if not exists xab_clean_room_intakes_status_idx
  on public.xab_clean_room_intakes (status, created_at desc);
create index if not exists xab_clean_room_intakes_ip_rate_idx
  on public.xab_clean_room_intakes (ip_hash, created_at desc);

alter table public.xab_clean_room_intakes enable row level security;

revoke all on table public.xab_clean_room_intakes from anon, authenticated;
grant all on table public.xab_clean_room_intakes to service_role;

comment on table public.xab_clean_room_intakes is
  'Isolated clean-room proof records for Xtreme AI Builder. Server service role only; no customer production data.';

commit;

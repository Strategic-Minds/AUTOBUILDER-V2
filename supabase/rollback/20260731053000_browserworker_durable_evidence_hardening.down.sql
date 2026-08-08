begin;

-- Security-preserving rollback: remove the new persistence RPC while retaining
-- service-role-only lease privileges and forced RLS. Restoring anonymous
-- SECURITY DEFINER execution is intentionally prohibited.
revoke all on function public.xab_v3_record_browser_validation(uuid, text, text, text, jsonb, jsonb, boolean) from public, anon, authenticated, service_role;
drop function if exists public.xab_v3_record_browser_validation(uuid, text, text, text, jsonb, jsonb, boolean);

-- Keep existing lease functions server-only during rollback.
revoke all on function public.xai_acquire_factory_lease(text, text, integer) from public, anon, authenticated;
revoke all on function public.xai_renew_factory_lease(text, text, integer) from public, anon, authenticated;
revoke all on function public.xai_release_factory_lease(text, text) from public, anon, authenticated;
grant execute on function public.xai_acquire_factory_lease(text, text, integer) to service_role;
grant execute on function public.xai_renew_factory_lease(text, text, integer) to service_role;
grant execute on function public.xai_release_factory_lease(text, text) to service_role;

alter table public.xai_factory_leases enable row level security;
alter table public.xai_factory_leases force row level security;
revoke all on table public.xai_factory_leases from public, anon, authenticated;
grant select, insert, update, delete on table public.xai_factory_leases to service_role;

alter table public.xab_v3_browser_jobs enable row level security;
alter table public.xab_v3_browser_jobs force row level security;
alter table public.xab_v3_receipts enable row level security;
alter table public.xab_v3_receipts force row level security;
revoke insert, update, delete on table public.xab_v3_browser_jobs from anon, authenticated;
revoke insert, update, delete on table public.xab_v3_receipts from anon, authenticated;
grant select, insert, update, delete on table public.xab_v3_browser_jobs to service_role;
grant select, insert, update, delete on table public.xab_v3_receipts to service_role;

commit;

begin;

revoke all on table public.xab_clean_room_intakes from service_role;
drop table if exists public.xab_clean_room_intakes;

commit;

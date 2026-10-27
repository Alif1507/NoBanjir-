-- Accounts and reports for the NO BANJIR! web MVP.
begin;

create type public.app_role as enum ('reporter', 'officer', 'admin');
create type public.report_category as enum ('GENANGAN', 'SALURAN_TERSUMBAT', 'SAMPAH', 'LAINNYA');
create type public.report_status as enum ('DIKIRIM', 'DIPROSES', 'SELESAI', 'DITOLAK');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 120),
  role public.app_role not null default 'reporter',
  created_at timestamptz not null default now()
);

create function public.create_reporter_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(
    nullif(left(btrim(new.raw_user_meta_data->>'display_name'), 120), ''),
    nullif(left(split_part(coalesce(new.email, ''), '@', 1), 120), ''),
    'Pengguna'
  ));
  return new;
end;
$$;
revoke all on function public.create_reporter_profile() from public, anon, authenticated;
create trigger create_reporter_profile_after_signup after insert on auth.users
  for each row execute function public.create_reporter_profile();
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(left(btrim(u.raw_user_meta_data->>'display_name'),120),''),
  nullif(left(split_part(coalesce(u.email,''),'@',1),120),''),'Pengguna')
from auth.users u on conflict (id) do nothing;

create table public.environment_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  category public.report_category not null,
  location_text text not null check (length(location_text) between 3 and 200),
  description text not null check (length(description) between 20 and 2000),
  photo_path text unique,
  status public.report_status not null default 'DIKIRIM',
  staff_note text check (staff_note is null or length(staff_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index environment_reports_reporter_time_idx on public.environment_reports(reporter_id, created_at desc);
create index environment_reports_status_time_idx on public.environment_reports(status, created_at desc);

create function public.limit_report_creation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles where id = new.reporter_id for update;
  if exists (select 1 from public.environment_reports r
    where r.reporter_id = new.reporter_id and r.created_at > clock_timestamp() - interval '60 seconds') then
    raise exception 'REPORT_RATE_LIMITED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.limit_report_creation() from public, anon, authenticated;
create trigger limit_report_creation_before_insert before insert on public.environment_reports
  for each row execute function public.limit_report_creation();

create table public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.environment_reports(id) on delete cascade,
  old_status public.report_status not null,
  new_status public.report_status not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);
create index report_status_history_report_time_idx on public.report_status_history(report_id, created_at desc);
create index report_status_history_changed_by_idx on public.report_status_history(changed_by);

alter table public.profiles enable row level security;
alter table public.environment_reports enable row level security;
alter table public.report_status_history enable row level security;
revoke all on public.profiles, public.environment_reports, public.report_status_history from public, anon, authenticated;
grant select on public.profiles, public.environment_reports, public.report_status_history to authenticated;
grant all on public.profiles, public.environment_reports, public.report_status_history to service_role;

create policy profiles_self_select on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy reports_owner_or_staff_select on public.environment_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('officer','admin')
  ));
create policy report_history_owner_or_staff_select on public.report_status_history for select to authenticated
  using (exists (select 1 from public.environment_reports r where r.id = report_id));

-- Server routes use a verified Auth token plus the server key for creation and
-- photo attachment. Status changes additionally enforce role in this RPC.
create function public.transition_report(p_report_id uuid, p_status public.report_status,
  p_staff_note text default null) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old public.report_status;
  v_note text := nullif(btrim(p_staff_note), '');
begin
  if v_actor is null or not exists (
    select 1 from public.profiles p where p.id = v_actor and p.role in ('officer','admin')
  ) then raise exception 'NOT_AUTHORIZED' using errcode = '42501'; end if;
  if p_status not in ('DIPROSES','SELESAI','DITOLAK') or length(coalesce(p_staff_note,'')) > 1000
    or (p_status = 'DITOLAK' and length(coalesce(v_note,'')) < 5) then
    raise exception 'INVALID_TRANSITION' using errcode = '22023';
  end if;
  select status into v_old from public.environment_reports where id = p_report_id for update;
  if not found then return false; end if;
  if not ((v_old = 'DIKIRIM' and p_status in ('DIPROSES','DITOLAK'))
    or (v_old = 'DIPROSES' and p_status in ('SELESAI','DITOLAK'))) then
    raise exception 'INVALID_TRANSITION' using errcode = '22023';
  end if;
  update public.environment_reports set status = p_status, staff_note = v_note,
    updated_at = clock_timestamp(),
    resolved_at = case when p_status in ('SELESAI','DITOLAK') then clock_timestamp() else null end
    where id = p_report_id;
  insert into public.report_status_history(report_id, old_status, new_status, changed_by, note)
  values (p_report_id, v_old, p_status, v_actor, v_note);
  return true;
end;
$$;
revoke all on function public.transition_report(uuid,public.report_status,text) from public, anon, authenticated;
grant execute on function public.transition_report(uuid,public.report_status,text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos','report-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

commit;

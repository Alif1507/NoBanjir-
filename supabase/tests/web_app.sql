-- Execute only after web_app migration. All fixtures roll back.
begin;
create temporary table web_app_fixture (reporter uuid, officer uuid, outsider uuid, report_id uuid);
grant select on web_app_fixture to authenticated;
do $$
declare
  reporter uuid := gen_random_uuid();
  officer uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  v_report_id uuid;
begin
  insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
  values (reporter,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'rollback-reporter@example.invalid','',clock_timestamp(),clock_timestamp(),clock_timestamp()),
    (officer,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'rollback-officer@example.invalid','',clock_timestamp(),clock_timestamp(),clock_timestamp()),
    (outsider,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'rollback-outsider@example.invalid','',clock_timestamp(),clock_timestamp(),clock_timestamp());
  assert (select count(*) from public.profiles where id in (reporter,officer,outsider))=3,
    'signup trigger must create profiles';
  assert (select count(*) from public.profiles where id in (reporter,officer,outsider) and role='reporter')=3,
    'new users must never start as staff';
  update public.profiles set role='officer' where id=officer;
  insert into public.environment_reports(reporter_id,category,location_text,description)
    values (reporter,'GENANGAN','Dekat gerbang sekolah','Ada genangan yang menghalangi jalan masuk sekolah.')
    returning id into v_report_id;
  insert into web_app_fixture values (reporter, officer, outsider, v_report_id);
end;
$$;

select set_config('request.jwt.claim.sub',(select reporter::text from web_app_fixture),true);
set local role authenticated;
do $$
begin
  assert (select count(*) from public.environment_reports)=1, 'reporter must see own report';
  begin
    update public.profiles set role='admin' where id=(select reporter from web_app_fixture);
    raise exception 'self promotion succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.transition_report((select report_id from web_app_fixture),'DIPROSES',null);
    raise exception 'reporter status change succeeded';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub',(select outsider::text from web_app_fixture),true);
set local role authenticated;
do $$
begin
  assert (select count(*) from public.environment_reports)=0,
    'a different reporter must not see this report';
  assert (select count(*) from public.report_status_history)=0,
    'a different reporter must not see its history';
end;
$$;
reset role;

select set_config('request.jwt.claim.sub',(select officer::text from web_app_fixture),true);
set local role authenticated;
do $$
begin
  assert public.transition_report((select report_id from web_app_fixture),'DIPROSES','Sedang ditinjau'), 'officer transition must succeed';
  assert (select status from public.environment_reports where id=(select report_id from web_app_fixture))='DIPROSES',
    'report status must update';
  assert (select count(*) from public.report_status_history where report_id=(select report_id from web_app_fixture))=1,
    'transition must add history';
end;
$$;
reset role;
rollback;

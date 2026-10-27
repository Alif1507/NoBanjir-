-- Apply to the intended NO BANJIR! project after inspecting existing tables.
-- Public data contains sensor information only. All mutations are service-only.
begin;

create type public.flood_warning as enum ('NORMAL', 'WASPADA', 'SIAGA', 'BAHAYA');

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  device_code text not null unique check (device_code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'),
  name text not null check (length(name) between 1 and 120),
  location_description text not null check (length(location_description) between 1 and 500),
  sensor_to_zero_cm numeric not null,
  min_distance_cm numeric not null check (min_distance_cm > 0 and min_distance_cm < 10000),
  max_distance_cm numeric not null check (max_distance_cm <= 10000),
  max_water_height_cm numeric not null check (max_water_height_cm > 0),
  waspada_min_cm numeric not null check (waspada_min_cm >= 0),
  siaga_min_cm numeric not null,
  bahaya_min_cm numeric not null,
  offline_after_seconds integer not null default 90 check (offline_after_seconds between 15 and 86400),
  min_ingest_interval_seconds integer not null default 1 check (min_ingest_interval_seconds between 1 and 300),
  is_active boolean not null default true,
  last_seen_at timestamptz,
  last_warning_level public.flood_warning,
  created_at timestamptz not null default now(),
  check (min_distance_cm < max_distance_cm),
  check (sensor_to_zero_cm between min_distance_cm and max_distance_cm),
  check (max_water_height_cm <= sensor_to_zero_cm - min_distance_cm),
  check (waspada_min_cm < siaga_min_cm and siaga_min_cm < bahaya_min_cm),
  check (bahaya_min_cm <= max_water_height_cm)
);

create table public.device_credentials (
  device_id uuid primary key references public.devices(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  rotated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  distance_cm numeric,
  water_height_cm numeric,
  is_raining boolean,
  float_switch_critical boolean,
  warning_level public.flood_warning,
  is_valid boolean not null,
  validation_reason text check (validation_reason in ('ULTRASONIC_UNAVAILABLE', 'DISTANCE_OUT_OF_RANGE', 'HEIGHT_OUT_OF_RANGE')),
  measured_at timestamptz,
  received_at timestamptz not null default clock_timestamp()
);
create index sensor_readings_device_time_idx on public.sensor_readings(device_id, received_at desc, id desc);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  reading_id uuid not null references public.sensor_readings(id) on delete cascade,
  previous_level public.flood_warning,
  new_level public.flood_warning not null,
  trigger_source text not null check (trigger_source in ('WATER_LEVEL', 'FLOAT_SWITCH')),
  created_at timestamptz not null default clock_timestamp()
);
create index alert_events_device_time_idx on public.alert_events(device_id, created_at desc);

alter table public.devices enable row level security;
alter table public.device_credentials enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.alert_events enable row level security;

revoke all on public.devices, public.device_credentials, public.sensor_readings, public.alert_events from public, anon, authenticated;
grant select on public.devices, public.sensor_readings, public.alert_events to anon, authenticated;
grant all on public.devices, public.device_credentials, public.sensor_readings, public.alert_events to service_role;
create policy devices_public_active on public.devices for select to anon, authenticated using (is_active);
create policy readings_public_active on public.sensor_readings for select to anon, authenticated using (
  exists (select 1 from public.devices d where d.id = device_id and d.is_active)
);
create policy alerts_public_active on public.alert_events for select to anon, authenticated using (
  exists (select 1 from public.devices d where d.id = device_id and d.is_active)
);
-- No policies or public grants exist for device_credentials.

create function public.ingest_sensor_reading(
  p_token_hash text, p_device_code text, p_distance_cm numeric,
  p_is_raining boolean, p_float_switch_critical boolean, p_measured_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  d public.devices%rowtype;
  v_received_at timestamptz;
  v_height numeric;
  v_valid boolean := true;
  v_reason text;
  v_warning public.flood_warning;
  v_reading_id uuid;
  v_wait integer;
begin
  -- This same device lock is acquired by rotation/revocation. Read the credential
  -- in a fresh statement after the lock so an old hash cannot pass after revoke.
  select device.* into d from public.devices device
    where device.device_code = p_device_code for update of device;
  if not found then return jsonb_build_object('status', 401, 'error', 'UNAUTHORIZED'); end if;
  if not exists (select 1 from public.device_credentials credential
      where credential.device_id = d.id and credential.token_hash = p_token_hash
        and credential.revoked_at is null) then
    return jsonb_build_object('status', 401, 'error', 'UNAUTHORIZED');
  end if;
  if not d.is_active then return jsonb_build_object('status', 403, 'error', 'DEVICE_DISABLED'); end if;
  v_received_at := clock_timestamp();
  if (p_distance_cm is not null and (p_distance_cm::text in ('NaN','Infinity','-Infinity')
      or p_distance_cm < 0 or p_distance_cm > 10000))
    or (p_measured_at is not null and (not isfinite(p_measured_at)
      or p_measured_at < v_received_at - interval '120 seconds'
      or p_measured_at > v_received_at + interval '30 seconds')) then
    return jsonb_build_object('status', 400, 'error', 'INVALID_READING');
  end if;
  if d.last_seen_at is not null and
    v_received_at < d.last_seen_at + make_interval(secs => d.min_ingest_interval_seconds) then
    v_wait := greatest(1, ceil(extract(epoch from
      d.last_seen_at + make_interval(secs => d.min_ingest_interval_seconds) - v_received_at))::integer);
    return jsonb_build_object('status', 429, 'error', 'RATE_LIMITED', 'retry_after', v_wait);
  end if;

  if p_distance_cm is null then
    v_valid := false; v_reason := 'ULTRASONIC_UNAVAILABLE';
  elsif p_distance_cm < d.min_distance_cm or p_distance_cm > d.max_distance_cm then
    v_valid := false; v_reason := 'DISTANCE_OUT_OF_RANGE';
  else
    v_height := d.sensor_to_zero_cm - p_distance_cm;
    if v_height < 0 or v_height > d.max_water_height_cm then
      v_height := null; v_valid := false; v_reason := 'HEIGHT_OUT_OF_RANGE';
    end if;
  end if;

  if p_float_switch_critical is true then v_warning := 'BAHAYA';
  elsif v_valid then
    if v_height >= d.bahaya_min_cm then v_warning := 'BAHAYA';
    elsif v_height >= d.siaga_min_cm then v_warning := 'SIAGA';
    elsif v_height >= d.waspada_min_cm then v_warning := 'WASPADA';
    else v_warning := 'NORMAL'; end if;
  end if;

  insert into public.sensor_readings(device_id, distance_cm, water_height_cm,
    is_raining, float_switch_critical, warning_level, is_valid, validation_reason, measured_at, received_at)
  values (d.id, p_distance_cm, v_height, p_is_raining, p_float_switch_critical,
    v_warning, v_valid, v_reason, p_measured_at, v_received_at)
  returning id into v_reading_id;

  if v_warning is not null and v_warning is distinct from d.last_warning_level then
    insert into public.alert_events(device_id, reading_id, previous_level, new_level, trigger_source, created_at)
    values (d.id, v_reading_id, d.last_warning_level, v_warning,
      case when p_float_switch_critical is true then 'FLOAT_SWITCH' else 'WATER_LEVEL' end, v_received_at);
  end if;
  update public.devices set last_seen_at = v_received_at,
    last_warning_level = coalesce(v_warning, last_warning_level) where id = d.id;
  return jsonb_build_object('status', 201, 'reading_id', v_reading_id,
    'water_height_cm', v_height, 'warning_level', v_warning, 'received_at', v_received_at, 'is_valid', v_valid);
end;
$$;
revoke all on function public.ingest_sensor_reading(text,text,numeric,boolean,boolean,timestamptz) from public, anon, authenticated;
grant execute on function public.ingest_sensor_reading(text,text,numeric,boolean,boolean,timestamptz) to service_role;

-- Provisioning is atomic; an existing device code is never silently overwritten.
create function public.provision_device(p_config jsonb, p_token_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_device_id uuid;
begin
  insert into public.devices(device_code,name,location_description,sensor_to_zero_cm,
    min_distance_cm,max_distance_cm,max_water_height_cm,waspada_min_cm,siaga_min_cm,bahaya_min_cm,
    offline_after_seconds,min_ingest_interval_seconds)
  values (p_config->>'device_code',p_config->>'name',p_config->>'location_description',
    (p_config->>'sensor_to_zero_cm')::numeric,(p_config->>'min_distance_cm')::numeric,
    (p_config->>'max_distance_cm')::numeric,(p_config->>'max_water_height_cm')::numeric,
    (p_config->>'waspada_min_cm')::numeric,(p_config->>'siaga_min_cm')::numeric,
    (p_config->>'bahaya_min_cm')::numeric,coalesce((p_config->>'offline_after_seconds')::integer,90),
    coalesce((p_config->>'min_ingest_interval_seconds')::integer,1)) returning id into v_device_id;
  insert into public.device_credentials(device_id,token_hash) values (v_device_id,p_token_hash);
  return v_device_id;
end;
$$;
revoke all on function public.provision_device(jsonb,text) from public, anon, authenticated;
grant execute on function public.provision_device(jsonb,text) to service_role;

create function public.rotate_device_token(p_device_code text,p_token_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_device_id uuid;
begin
  select d.id into v_device_id from public.devices d
    where d.device_code=p_device_code for update of d;
  if not found then return false; end if;
  update public.device_credentials set token_hash=p_token_hash,rotated_at=clock_timestamp(),revoked_at=null
    where device_id=v_device_id;
  return found;
end;
$$;
revoke all on function public.rotate_device_token(text,text) from public, anon, authenticated;
grant execute on function public.rotate_device_token(text,text) to service_role;

create function public.revoke_device_token(p_device_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_device_id uuid;
begin
  select d.id into v_device_id from public.devices d
    where d.device_code=p_device_code for update of d;
  if not found then return false; end if;
  update public.device_credentials set revoked_at=clock_timestamp() where device_id=v_device_id;
  return found;
end;
$$;
revoke all on function public.revoke_device_token(text) from public, anon, authenticated;
grant execute on function public.revoke_device_token(text) to service_role;

do $$
begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='sensor_readings') then
    alter publication supabase_realtime add table public.sensor_readings;
  end if;
end;
$$;

commit;

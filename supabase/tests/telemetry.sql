-- Run with postgres privileges AFTER the migration, on a development project.
-- All fixtures and mutations roll back. No real devices are provisioned.
begin;
do $$
declare
  v_device_id uuid;
  r jsonb;
  token text := repeat('a',64);
  before_alerts integer;
begin
  v_device_id := public.provision_device('{"device_code":"TEST-IOT-TRANSACTION","name":"TEST ONLY",
    "location_description":"Rollback fixture","sensor_to_zero_cm":100,"min_distance_cm":25,
    "max_distance_cm":450,"max_water_height_cm":75,"waspada_min_cm":10,"siaga_min_cm":20,
    "bahaya_min_cm":35}'::jsonb,token);
  r := public.ingest_sensor_reading(repeat('b',64),'TEST-IOT-TRANSACTION',85,false,null,null);
  assert (r->>'status')::int=401, 'incorrect token must be rejected';
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,null,null);
  assert (r->>'status')::int=201 and r->>'warning_level'='WASPADA', 'calibrated height selects Waspada';
  assert (r->>'water_height_cm')::numeric=15, 'height must be sensor_to_zero minus distance';
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,null,null);
  assert (r->>'status')::int=429, 'same device is throttled inside transaction';
  select count(*) into before_alerts from public.alert_events where device_id=v_device_id;
  update public.devices set last_seen_at=null where devices.id=v_device_id;
  perform public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,null,null);
  assert (select count(*) from public.alert_events where device_id=v_device_id)=before_alerts, 'same level must not duplicate alert';
  update public.devices set last_seen_at=null where devices.id=v_device_id;
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',null,true,false,null);
  assert not (r->>'is_valid')::boolean and r->>'warning_level' is null, 'failed ultrasonic is not Normal';
  update public.devices set last_seen_at=null where devices.id=v_device_id;
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',null,true,true,null);
  assert r->>'warning_level'='BAHAYA' and not (r->>'is_valid')::boolean, 'float alarm survives failed ultrasonic';
  update public.devices set last_seen_at=null where devices.id=v_device_id;
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',24,false,false,null);
  assert not (r->>'is_valid')::boolean and r->>'water_height_cm' is null, 'blind zone is invalid';
  update public.devices set last_seen_at=null where devices.id=v_device_id;
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',101,false,false,null);
  assert not (r->>'is_valid')::boolean and r->>'water_height_cm' is null, 'negative height is not clamped to zero';
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION','NaN'::numeric,false,false,null);
  assert (r->>'status')::int=400, 'nonfinite distance rejected';
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,false,clock_timestamp()-interval '121 seconds');
  assert (r->>'status')::int=400, 'stale timestamp rejected';
  update public.devices set is_active=false where devices.id=v_device_id;
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,false,null);
  assert (r->>'status')::int=403, 'inactive device rejected';
  update public.devices set is_active=true where devices.id=v_device_id;
  perform public.rotate_device_token('TEST-IOT-TRANSACTION',repeat('c',64));
  r := public.ingest_sensor_reading(token,'TEST-IOT-TRANSACTION',85,false,false,null);
  assert (r->>'status')::int=401, 'rotation invalidates old token';
  perform public.revoke_device_token('TEST-IOT-TRANSACTION');
  r := public.ingest_sensor_reading(repeat('c',64),'TEST-IOT-TRANSACTION',85,false,false,null);
  assert (r->>'status')::int=401, 'revoked token rejected';
end;
$$;

set local role anon;
do $$
begin
  assert (select count(*) from public.devices where device_code='TEST-IOT-TRANSACTION')=1,
    'active device should be publicly readable';
  begin
    perform token_hash from public.device_credentials;
    raise exception 'public read of device credentials succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.ingest_sensor_reading(repeat('a',64),'TEST-IOT-TRANSACTION',85,false,null,null);
    raise exception 'anonymous RPC execution succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.devices set sensor_to_zero_cm=200 where device_code='TEST-IOT-TRANSACTION';
    raise exception 'anonymous calibration mutation succeeded';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
rollback;

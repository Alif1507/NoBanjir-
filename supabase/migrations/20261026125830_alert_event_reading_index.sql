-- Supports the alert_events.reading_id foreign key and reading lookup.
create index alert_events_reading_id_idx on public.alert_events(reading_id);

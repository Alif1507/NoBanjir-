# Telemetry backend and realtime integration

The user selected Supabase and requested implementation of the proposed flow:
ESP32 → authenticated Next.js HTTPS endpoint → Supabase → realtime browser updates.
The firmware's existing JSON contract remains compatible. This implements that
agreed integration; the complete four-screen visual application remains a later
frontend task governed by `context/design.md`.

## Decisions

- Next.js App Router and strict TypeScript host `POST /api/iot/readings`, public
  dashboard/history read APIs, and a small `/iot` integration monitor. This monitor
  is a development/test route, not a substitute design for `/dashboard`.
- Supabase PostgreSQL owns calibration, warning rules, transaction-safe device
  throttling, reading insertion, and deduplicated warning transitions. SQL is the
  authoritative calculation path, not a caller-provided warning level.
- A service-only RPC authenticates SHA-256 hashes of randomly generated 256-bit
  device tokens and locks the device row to serialize rate checks and alert changes.
- Browser clients use a public Supabase key and RLS-protected telemetry. Device
  credentials and all writes remain inaccessible to anonymous/authenticated users.
- MVP realtime uses Supabase Postgres Changes on sanitized sensor readings;
  subscribe before refetching, refetch after reconnect, and poll as a fallback.
  A clock tick marks stale/offline states even when no new packets arrive.
- Failed ultrasonic distance is nullable; valid float-critical input still produces
  BAHAYA. Sensor error and flood level are separate fields. Invalid distance never
  becomes zero/Normal. Missing/stale data never becomes an assurance of safety.
- No seeded live device. Provisioning requires explicit measured calibration and
  thresholds, and writes a private local token file without logging the token.
- Local configuration examples and SQL migrations are reviewable artifacts.
  Cloud activation requires a Supabase project and keys in `.env.local`.

## Validation and operating constraints

Requests must be JSON, at most 2048 bytes, with a bounded device ID and bearer
token. Reject unexpected fields, non-finite/invalid types, and timestamps older
than 120 seconds or more than 30 seconds in the future. HTTPS is required except
loopback HTTP during development. SQL repeats timestamp/range defenses.

Public reads are bounded by time and row count, and never use a service key.
Store UTC; render WIB. Offline duration is configurable per device (default 90s).
HTTP errors do not return database messages, request bodies, credentials, or tokens.
Device credentials support rotation/revocation without a firmware-wide key.

## Verification

Node's test runner exercises actual Zod request validation and HTTP handler paths,
token hashing, body limits, error isolation, timestamps and device health. Include
SQL transaction tests for authentication, RLS, invalid readings, float overrides,
calibration, concurrent-safe throttling and alert transitions. Run database tests
when PostgreSQL/Supabase is available; report unavailable checks explicitly.
Build/typecheck Next.js when dependencies can be installed. The current shell
blocks registry network requests, so locally cached packages may only support
part of verification. Never claim a cloud or hardware connection without one.

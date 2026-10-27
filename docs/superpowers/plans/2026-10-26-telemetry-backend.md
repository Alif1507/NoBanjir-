# Telemetry Backend Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution.

**Goal:** Implement the agreed ESP32 → Next.js → Supabase → realtime browser flow.

**Architecture:** A bounded request handler calls one service-only PostgreSQL RPC
for authentication, rate limiting and atomic calculation/storage. Public read APIs
and a realtime hook provide sanitized telemetry and explicit stale/error states.

**Tech Stack:** Next.js 16.4.1+, React 19.3, TypeScript, Zod 4, Supabase JS 2,
PostgreSQL, Node 24 native TypeScript test runner.

**Spec:** `docs/superpowers/specs/2026-10-26-telemetry-backend-design.md` and
`context/NO_BANJIR_WEB_APP_SPEC.md`, sections 8–11.

## Constraints and review focus

- Match the existing Arduino firmware JSON. No secrets in browser or firmware.
- Raw telemetry cannot choose its own warning level or bypass device throttling.
- Distinguish invalid distance, float alarm, stale observations and offline device.
- Reconnect must refetch persisted state; events alone cannot establish freshness.
- SQL mutation/auth/rate/alert insertion must be one transaction with a row lock.
- Full product UI and auth/reporting remain separate from this integration task.

## Task 1: Validated ingestion and Next.js setup

Files: `package.json`, `tsconfig.json`, `src/lib/iot/{schema,ingest,health}.ts`,
`tests/*.test.ts`, and route wrappers in `src/app/api/`.

- [x] Write/run failing validation, HTTPS/auth, body-limit, backend-error and
  freshness tests with Node's test runner.
- [x] Implement the actual helpers and handler, then run to green.
- [x] Add server-only Supabase REST adapters and public read API wrappers.

## Task 2: PostgreSQL and provisioning

Files: `supabase/migrations/`, `supabase/tests/`, `scripts/provision-device.mjs`.

- [x] Implement constrained schema, RLS/grants, realtime publication, and
  service-only atomic ingestion RPC.
- [x] Add database assertions for auth, bad distance, critical override, thresholds,
  duplicate transitions, rate limit, permissions and timestamp checks.
- [x] Add explicit-calibration device provisioning and credential rotation/revoke
  commands, private token output and environment examples.

## Task 3: Realtime integration and handoff

Files: `src/hooks/use-telemetry.ts`, `src/app/iot/`, `docs/telemetry-setup.md`.

- [x] Implement initial load, subscription, reconnect refetch, bounded polling,
  cleanup, device selection, and stale-state timers in a small integration view.
- [x] Document local run, database application, provisioning, HTTPS deployment,
  firmware configuration, and actual verification limits.
- [x] Run available tests/typecheck/build/database checks and independent review;
  fix important findings before reporting completion.

## Execution record

- The user's “oke can you do that?” authorizes the architecture just proposed;
  proceed locally without another preference/approval loop.
- No connected Supabase management tool is available; project details requested
  asynchronously. Shell npm registry access is blocked (EACCES).
- Project URL supplied: `https://cdjwcogjstcqaltfhhle.supabase.co`. Supabase
  plugin suggested, but not yet connected. `.env.local` has URL and empty key
  slots; no secrets entered or read.
- 18 Node tests pass (actual Zod validation, handler paths, status freshness,
  provisioning token durability and Windows ACL, public key guard). The initial
  failure for missing implementation was observed before code. A reviewer found
  a token-file truncation risk, now fixed with a single immutable write.
- Ingestion and credential rotation/revocation now lock the device row in the
  same order; credential check happens after lock acquisition. SQL tests include
  auth, calibration, invalid distance, float override, throttling and RLS checks.
- `npm run typecheck`/`npm run build` cannot run: TypeScript/Next are absent and
  registry network is denied. SQL tests and deployment cannot run before MCP
  connection/database access; do not claim those outcomes.

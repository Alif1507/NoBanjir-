# NO BANJIR! Full Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the responsive Next.js MVP from the supplied PDF designs and PRD, using the connected Supabase project.

**Architecture:** Extend the existing telemetry API with Supabase Auth, reports, and protected admin operations. Build the four reference screens from reusable layout, auth, report, and dashboard components; add secondary routes for public guidance and role-specific workflows.

**Tech Stack:** Next.js App Router, TypeScript strict, Supabase Auth/Postgres/Storage/Realtime, CSS, Zod.

**Spec:** `context/design.md`, `context/NO_BANJIR_WEB_APP_SPEC.md`, `docs/superpowers/specs/2026-10-26-full-web-app-design.md`.

## Global Constraints

- Keep real and demo telemetry separate; no fabricated live safety status.
- Use original PDF photos and preserve section order and Indonesian copy.
- Only admin may edit calibration; only staff may update report status.
- Keep device tokens and server keys outside browser code.
- Make mobile pages work without horizontal overflow.

## Review Focus

- A stale or invalid sensor reading must never display “Kondisi Aman”.
- A reporter must not read or mutate another reporter's private report.
- A registered user must not elevate their role by editing a profile.
- Public report feeds must exclude names, notes, photos, and user IDs.
- Failed uploads must not leak a private object URL or mark a report as completed.

---

### Task 1: Data model and access rules

**Files:** `supabase/migrations/*_web_app.sql`, `supabase/tests/web_app.sql`, `src/lib/reports/*`.

- [ ] Write rollback-only SQL tests for profile creation, report ownership, staff transitions, and public projections.
- [ ] Apply a reviewed migration through MCP and record its generated version locally.
- [ ] Run SQL tests and security advisors.

### Task 2: Auth and report APIs

**Files:** `src/lib/auth/*`, `src/app/api/reports/**`, `src/app/api/admin/**`, `tests/*`.

- [ ] Write failing tests for validation and authorization decisions.
- [ ] Implement Auth session use, report submission/list/status, private photo upload, and admin calibration endpoints.
- [ ] Run unit tests and inspect server contracts.

### Task 3: PDF-faithful public pages

**Files:** `public/images/*`, `src/components/*`, `src/app/{page,globals.css,login,register,dashboard}/**`.

- [ ] Extract the original embedded photos.
- [ ] Implement header/footer, landing, auth split, dashboard, chart, report form, and explicit demo mode.
- [ ] Check responsive and empty/stale/error visual states.

### Task 4: Secondary MVP pages and documentation

**Files:** `src/app/{laporan,tingkat-kondisi,tentang,petugas,admin}/**`, `README.md`, `docs/telemetry-setup.md`.

- [ ] Implement public report list, personal report detail/list, officer panel, admin sensor settings, and guide pages.
- [ ] Verify navigation, role checks, and form errors.
- [ ] Run tests, typecheck, build, and visual QA where the environment permits; document exact limits.

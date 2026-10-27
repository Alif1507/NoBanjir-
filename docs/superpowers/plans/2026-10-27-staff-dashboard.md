# Staff and Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give officers and admins a role appropriate overview of reports and live sensor status.

**Architecture:** Reuse the existing staff reports API and public device/telemetry APIs. A shared client component renders `/petugas` and `/admin`; no schema changes are needed.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase backed APIs, existing CSS.

**Spec:** `docs/superpowers/specs/2026-10-27-staff-dashboard-design.md`

## Global Constraints

- Keep report data behind the existing staff authorized API.
- Show recent sample counts honestly when the 100 report limit is reached.
- Treat missing or stale telemetry as unknown, never as safe.

## Review Focus

- A reporter opening `/petugas` or `/admin` sees no staff data.
- An officer opening `/admin` sees no admin controls.
- Empty reports and empty sensors render useful messages.
- Live device health updates without representing stale readings as current.

## Tasks

- [x] Add a tested report summary helper that counts statuses and selects actionable recent reports.
- [x] Add the shared dashboard component with role checks, API loading/error states, report preview, and sensor status.
- [x] Add `/petugas` and `/admin` entry pages; connect role aware navigation and existing management pages.
- [x] Verify tests, typecheck, production build, and desktop/mobile rendering.

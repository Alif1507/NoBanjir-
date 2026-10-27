# NO BANJIR! web app setup

The Next.js source is in `src/`. The Supabase project is
`cdjwcogjstcqaltfhhle`. Telemetry and web app migrations have been applied.
The web app migration is
[`20261026220904_web_app.sql`](../supabase/migrations/20261026220904_web_app.sql).
The rollback test [`web_app.sql`](../supabase/tests/web_app.sql) passed on the
project. It left no test users or reports.

## Run locally

Use Node.js 24 or newer. Install the dependencies, then run:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

On systems where `npm` works directly, `npm` may replace `npm.cmd`. Dependencies
are installed, the lockfile is present, and the local typecheck, 25 tests, and
production build pass. Chrome rendering was checked at desktop size and at a
390 px mobile viewport for the four reference pages. The mobile pages have no
horizontal document overflow.

This execution environment still denies direct runtime connections to Supabase
with `EACCES`; local API routes therefore return a temporary 503. The Supabase
MCP connection works and the migration tests pass, but a deployed end-to-end
check remains necessary after hosting is configured.

Copy `.env.example` to `.env.local`. Set the project URL, publishable key, and
server secret key. `.env.local` is ignored by Git. Keep the server key on the
server; only variables prefixed `NEXT_PUBLIC_` are shipped to the browser.

Configure Supabase Auth email sign-up and the redirect URL for the local or
deployed domain. New users receive the `reporter` role through the database
trigger. A designated project operator can promote a registered account to
`officer` or `admin` with a privileged SQL query after verifying the person's
identity:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'verified-admin@example.com');
```

Run that query only in the trusted Supabase SQL editor or an authorized MCP
session. It is not part of sign-up. Replace `admin` with `officer` for staff.

## Routes

- `/`, `/login`, `/register`: public landing and account screens based on the
  supplied PDF mockups.
- `/dashboard`: live monitoring. `/dashboard?demo=1` is labeled simulation.
- `/laporan`, `/laporan/buat`, `/laporan/saya`, `/laporan/[id]`: public list,
  submission, owner history, and authorized detail.
- `/petugas/laporan`: staff queue and status transitions.
- `/admin/perangkat`: device calibration and thresholds.
- `/tingkat-kondisi`, `/tentang`: condition guide and project information.

Report photos live in the private `report-photos` bucket. The server checks
report ownership or staff role before streaming a photo. The public report
listing returns category, status, and dates only.

Before using live warnings, provision and physically calibrate a device using
the [telemetry guide](telemetry-setup.md). There are currently no devices or
readings in the cloud project. A dashboard with no live data deliberately shows
unknown status instead of a safe level.

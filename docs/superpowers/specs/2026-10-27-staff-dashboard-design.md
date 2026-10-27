# Staff and admin dashboard design

The existing app already has a staff report queue, report transitions, and an
admin device settings page. Add an overview that gives officers and admins one
place to start their work. Keep the same light editorial style as the public
pages. No new database schema or privilege is needed.

`/petugas` is available to officers and admins. `/admin` is available only to
admins and adds a prominent device settings action. Both render the same
overview: counts by report status from the most recent 100 staff visible
reports, a short list that needs attention, a selected active sensor's current
health/reading, and links to the existing report queue and device settings.
Counts must be labeled as recent if the 100 row API cap is reached. An empty
report list and no active sensors have clear empty states. Sensor health and
flood warning remain separate, including offline and invalid readings.

Use the existing authenticated `/api/reports?scope=staff` endpoint and public
device/telemetry endpoints. The server already checks staff role on report
data; the UI checks role again before rendering it. Do not expose report
descriptions or locations to nonstaff users. Existing report detail and device
settings remain the places where changes are made.

import type { EnvironmentReport } from "../reports/schema.ts";

type ReportForSummary = Pick<EnvironmentReport, "id" | "status" | "created_at">;

export function summarizeStaffReports<T extends ReportForSummary>(reports: readonly T[]) {
  const counts = { DIKIRIM: 0, DIPROSES: 0, SELESAI: 0, DITOLAK: 0 };
  for (const report of reports) counts[report.status]++;
  const actionable = reports.filter(report => report.status === "DIKIRIM" || report.status === "DIPROSES")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
  return { counts, actionable, isPartial: reports.length >= 100 };
}

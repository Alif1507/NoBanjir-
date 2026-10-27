import type { EnvironmentReport } from "../reports/schema.ts";

export type AppRole = "reporter" | "officer" | "admin";
export function isStaff(role: AppRole | null | undefined) { return role === "officer" || role === "admin"; }

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return "/dashboard";
  }
  try {
    const parsed = new URL(value, "https://nobanjir.local");
    return parsed.origin === "https://nobanjir.local" ? parsed.pathname + parsed.search + parsed.hash : "/dashboard";
  } catch { return "/dashboard"; }
}

export function canTransition(from: EnvironmentReport["status"], to: EnvironmentReport["status"]) {
  return (from === "DIKIRIM" && (to === "DIPROSES" || to === "DITOLAK")) ||
    (from === "DIPROSES" && (to === "SELESAI" || to === "DITOLAK"));
}

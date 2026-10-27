import test from "node:test";
import assert from "node:assert/strict";
import { summarizeStaffReports } from "../src/lib/staff/summary.ts";

test("staff overview prioritizes open reports and never counts closed reports as pending", () => {
  const reports = [
    { id: "done", status: "SELESAI", created_at: "2026-10-25T12:00:00Z" },
    { id: "new", status: "DIKIRIM", created_at: "2026-10-27T12:00:00Z" },
    { id: "processing", status: "DIPROSES", created_at: "2026-10-26T12:00:00Z" },
    { id: "rejected", status: "DITOLAK", created_at: "2026-10-24T12:00:00Z" },
  ] as const;
  const summary = summarizeStaffReports(reports);
  assert.deepEqual(summary.counts, { DIKIRIM: 1, DIPROSES: 1, SELESAI: 1, DITOLAK: 1 });
  assert.deepEqual(summary.actionable.map(report => report.id), ["new", "processing"]);
  assert.equal(summary.isPartial, false);
});

test("staff overview labels a full API page as a partial recent sample", () => {
  const reports = Array.from({ length: 100 }, (_, index) => ({
    id: `report-${index}`, status: "DIKIRIM" as const,
    created_at: new Date(2026, 9, 27, 0, index).toISOString(),
  }));
  const summary = summarizeStaffReports(reports);
  assert.equal(summary.isPartial, true);
  assert.equal(summary.counts.DIKIRIM, 100);
  assert.equal(summary.actionable.length, 5);
  assert.equal(summary.actionable[0].id, "report-99");
});

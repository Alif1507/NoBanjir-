import test from "node:test";
import assert from "node:assert/strict";
import { parseReport, parseReportTransition } from "../src/lib/reports/schema.ts";
import { demoSnapshot, demoSeries } from "../src/lib/demo/data.ts";
import { safeNextPath, canTransition } from "../src/lib/auth/permissions.ts";
import { photoExtension, validPhotoBytes } from "../src/lib/reports/photo.ts";
import { readBytesLimited } from "../src/lib/http/body.ts";

test("reports reject blank locations, short descriptions, and unknown categories", () => {
  assert.equal(parseReport({ category: "GENANGAN", location_text: "  ", description: "A short note" }).success, false);
  assert.equal(parseReport({ category: "BANJIR", location_text: "Gerbang sekolah", description: "Air menutup pintu gerbang sekolah." }).success, false);
  assert.equal(parseReport({ category: "GENANGAN", location_text: "Gerbang sekolah", description: "Air menutup pintu gerbang sekolah." }).success, true);
});

test("rejections need an explanation and ordinary transitions cannot skip review", () => {
  assert.equal(parseReportTransition({ status: "DITOLAK", staff_note: "" }).success, false);
  assert.equal(parseReportTransition({ status: "DIKIRIM", staff_note: "x" }).success, false);
  assert.equal(parseReportTransition({ status: "DIPROSES", staff_note: "Sedang ditinjau" }).success, true);
});

test("demo values stay explicitly simulated and independent from device IDs", () => {
  const now = new Date("2026-10-26T10:00:00Z");
  const snapshot = demoSnapshot("SIAGA", true, false, now);
  assert.equal(snapshot.source, "DEMO");
  assert.equal(snapshot.level, "SIAGA");
  assert.equal(snapshot.heightCm, 25);
  assert.equal(snapshot.deviceId, null);
  assert.equal(snapshot.health, "ONLINE");
  assert.equal(demoSnapshot("NORMAL", false, true, now).level, null);
  assert.equal(demoSeries("SIAGA", "1h", now).every(point => point.source === "DEMO"), true);
});

test("login continuation never redirects outside this app", () => {
  assert.equal(safeNextPath("/laporan/buat"), "/laporan/buat");
  assert.equal(safeNextPath("https://evil.example"), "/dashboard");
  assert.equal(safeNextPath("//evil.example"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.example"), "/dashboard");
});

test("report status flow cannot skip processing or reopen a closed report", () => {
  assert.equal(canTransition("DIKIRIM", "SELESAI"), false);
  assert.equal(canTransition("DIKIRIM", "DIPROSES"), true);
  assert.equal(canTransition("DIPROSES", "SELESAI"), true);
  assert.equal(canTransition("DITOLAK", "DIPROSES"), false);
});

test("private report photos accept only three image types and up to 5 MiB", () => {
  assert.equal(photoExtension("image/jpeg", 500), "jpg");
  assert.equal(photoExtension("image/webp", 5 * 1024 * 1024), "webp");
  assert.equal(photoExtension("image/svg+xml", 100), null);
  assert.equal(photoExtension("image/png", 5 * 1024 * 1024 + 1), null);
  assert.equal(validPhotoBytes("image/png", new Uint8Array([137,80,78,71,13,10,26,10])), true);
  assert.equal(validPhotoBytes("image/png", new Uint8Array([60,115,118,103])), false);
});

test("web API body limit applies when Content-Length is absent", async () => {
  const request = new Request("https://example.test/api/reports", { method: "POST", body: "123456789" });
  await assert.rejects(() => readBytesLimited(request, 8), /BODY_TOO_LARGE/);
  const accepted = new Request("https://example.test/api/reports", { method: "POST", body: "1234" });
  assert.equal(new TextDecoder().decode(await readBytesLimited(accepted, 8)), "1234");
});

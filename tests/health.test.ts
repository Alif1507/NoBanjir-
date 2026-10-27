import { test } from "node:test";
import assert from "node:assert/strict";
import { deviceHealth } from "../src/lib/iot/health.ts";

const now = Date.parse("2026-10-26T08:00:00Z");
const fresh = { received_at: "2026-10-26T07:59:55Z", measured_at: "2026-10-26T07:59:54Z",
  is_valid: true, warning_level: "NORMAL" as const };
test("missing data is unknown, never safe", () => {
  assert.equal(deviceHealth(null, 90, now), "UNKNOWN");
});
test("offline status advances with the clock without a new sensor event", () => {
  assert.equal(deviceHealth(fresh, 90, now), "ONLINE");
  assert.equal(deviceHealth(fresh, 90, now + 90000), "OFFLINE");
});
test("invalid distance stays Error even with an independent critical warning", () => {
  const criticalReading = { ...fresh, is_valid: false, warning_level: "BAHAYA" as const };
  assert.equal(deviceHealth(criticalReading, 90, now), "ERROR");
});
test("old measurements do not become fresh merely because received_at is new", () => {
  assert.equal(deviceHealth({ ...fresh, measured_at: "2026-10-26T07:58:00Z" }, 90, now), "STALE");
});

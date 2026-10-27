import { test } from "node:test";
import assert from "node:assert/strict";
import { provisionConfigSchema } from "../src/lib/iot/provision-config.ts";
import { historyStart } from "../src/lib/iot/history.ts";

const config = { device_code: "ESP32-NB-001", name: "Test sensor", location_description: "Test location",
  sensor_to_zero_cm: 100, min_distance_cm: 25, max_distance_cm: 450, max_water_height_cm: 75,
  waspada_min_cm: 10, siaga_min_cm: 20, bahaya_min_cm: 35 };
test("requires explicit calibration instead of default demo thresholds", () => {
  assert.equal(provisionConfigSchema.safeParse(config).success, true);
  const { waspada_min_cm: _missing, ...partial } = config;
  assert.equal(provisionConfigSchema.safeParse(partial).success, false);
});
test("rejects unordered thresholds and blind-zone installations", () => {
  for (const override of [{ siaga_min_cm: 10 }, { max_water_height_cm: 80 },
    { bahaya_min_cm: 76 }, { sensor_to_zero_cm: Number.NaN }, { offline_after_seconds: 0 }]) {
    assert.equal(provisionConfigSchema.safeParse({ ...config, ...override }).success, false);
  }
});
test("history ranges reject inherited object names and preserve bounded windows", () => {
  const now = new Date("2026-10-26T08:00:00Z");
  assert.equal(historyStart("1h", now), "2026-10-26T07:00:00.000Z");
  assert.equal(historyStart("constructor", now), null);
  assert.equal(historyStart("__proto__", now), null);
  assert.equal(historyStart("30d", now), null);
});

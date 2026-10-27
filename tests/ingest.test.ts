import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createIngestHandler } from "../src/lib/iot/ingest.ts";

const now = new Date("2026-10-26T08:00:00Z");
const token = "a".repeat(43);
const packet = { device_code: "ESP32-NB-001", distance_cm: 38,
  is_raining: false, float_switch_critical: null, measured_at: now.toISOString() };
const stored = { status: 201, reading_id: "b98b6621-e407-4de4-879e-8c41e01fc58b",
  water_height_cm: 12, warning_level: "WASPADA", received_at: now.toISOString(), is_valid: true };
function request(body: unknown = packet, options: RequestInit = {}) {
  return new Request("https://example.test/api/iot/readings", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body), ...options });
}

test("authenticates using a token hash and accepts the firmware packet", async () => {
  let called = false;
  const handler = createIngestHandler({ now: () => now, async store(hash, value) {
    called = true;
    assert.equal(hash, createHash("sha256").update(token).digest("hex"));
    assert.equal(value.device_code, packet.device_code);
    return stored;
  } });
  const response = await handler(request());
  assert.equal(response.status, 201);
  assert.equal((await response.json()).warning_level, "WASPADA");
  assert.equal(called, true);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("accepts missing clock and null failed distance without manufacturing Normal", async () => {
  const handler = createIngestHandler({ now: () => now, async store(_hash, value) {
    assert.equal(value.distance_cm, null);
    assert.equal(value.measured_at, undefined);
    return { ...stored, water_height_cm: null, warning_level: "BAHAYA", is_valid: false };
  } });
  const response = await handler(request({ device_code: packet.device_code,
    distance_cm: null, is_raining: true, float_switch_critical: true }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).warning_level, "BAHAYA");
});

test("rejects missing auth before reading a malformed body", async () => {
  const handler = createIngestHandler({ now: () => now, async store() { assert.fail("must not store"); } });
  const response = await handler(request({}, { headers: {}, body: "bad json" }));
  assert.equal(response.status, 401);
});

test("rejects unexpected warning level, wrong types and impossible timestamps", async () => {
  const handler = createIngestHandler({ now: () => now, async store() { assert.fail("must not store"); } });
  for (const value of [{ ...packet, warning_level: "NORMAL" }, { ...packet, is_raining: "false" },
    { ...packet, distance_cm: -1 }, { ...packet, measured_at: "yesterday" },
    { ...packet, measured_at: "2026-10-26T07:57:59Z" },
    { ...packet, measured_at: "2026-10-26T08:00:31Z" }]) {
    assert.equal((await handler(request(value))).status, 400);
  }
});

test("enforces the actual byte size even when Content-Length is absent", async () => {
  const handler = createIngestHandler({ now: () => now, async store() { assert.fail("must not store"); } });
  assert.equal((await handler(request({}, { body: " ".repeat(2049) }))).status, 413);
  assert.equal((await handler(request({}, { body: "{bad json}" }))).status, 400);
  assert.equal((await handler(request({}, { headers: { Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain" } }))).status, 415);
});

test("reports per-device throttling with a Retry-After header", async () => {
  const handler = createIngestHandler({ now: () => now,
    async store() { return { status: 429, error: "RATE_LIMITED", retry_after: 1 }; } });
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "1");
});

test("isolates backend errors from device responses", async () => {
  const handler = createIngestHandler({ now: () => now, async store() { throw new Error("PRIVATE-DATABASE-SECRET"); } });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes("PRIVATE"), false);
});

test("requires HTTPS except loopback development", async () => {
  const handler = createIngestHandler({ now: () => now, async store() { return stored; } });
  const insecure = new Request("http://example.test/api/iot/readings", request());
  assert.equal((await handler(insecure)).status, 400);
});

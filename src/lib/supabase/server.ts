import "server-only";
import type { TelemetryPacket } from "../iot/schema.ts";
import { isPublicKey } from "./public-key.ts";

function settings(privileged: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = privileged ? process.env.SUPABASE_SECRET_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !url.startsWith("https://")) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!privileged && !isPublicKey(key)) throw new Error("INVALID_PUBLIC_KEY");
  return { url, key };
}

export async function supabaseRest(path: string, privileged = false, init: RequestInit = {}) {
  const { url, key } = settings(privileged);
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  // Legacy keys are JWTs; new sb_secret/sb_publishable keys use apikey only.
  if (!key.startsWith("sb_")) headers.set("Authorization", `Bearer ${key}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("SUPABASE_REQUEST_FAILED");
  return response.json() as Promise<unknown>;
}

export function storeReading(tokenHash: string, packet: TelemetryPacket) {
  return supabaseRest("rpc/ingest_sensor_reading", true, { method: "POST", body: JSON.stringify({
    p_token_hash: tokenHash, p_device_code: packet.device_code, p_distance_cm: packet.distance_cm,
    p_is_raining: packet.is_raining, p_float_switch_critical: packet.float_switch_critical,
    p_measured_at: packet.measured_at ?? null,
  }) });
}

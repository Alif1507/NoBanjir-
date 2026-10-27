"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { readingSchema } from "../lib/iot/schema.ts";
import type { SensorReading } from "../lib/iot/schema.ts";
import { deviceHealth } from "../lib/iot/health.ts";
import { browserSupabase } from "../lib/supabase/browser.ts";

export type HistoryRange = "1h" | "6h" | "24h" | "7d";
type State = {
  key: string; reading: SensorReading | null; history: SensorReading[];
  loading: boolean; error: string | null; realtime: boolean; truncated: boolean;
};
function empty(key: string): State {
  return { key, reading: null, history: [], loading: true, error: null, realtime: false, truncated: false };
}

export function useTelemetry(deviceId: string | null, offlineAfterSeconds: number, range: HistoryRange) {
  const key = `${deviceId ?? ""}:${range}`;
  const [state, setState] = useState<State>(() => empty(key));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setState(empty(key));
    if (!deviceId) return;
    let disposed = false;
    let inFlight = false;
    let rerun = false;
    const controller = new AbortController();
    async function refresh() {
      if (disposed) return;
      if (inFlight) { rerun = true; return; }
      inFlight = true;
      try {
        do {
          rerun = false;
          const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
          const [latest, history] = await Promise.all([
            fetch(`/api/dashboard?device_id=${deviceId}`, { cache: "no-store", signal }),
            fetch(`/api/readings?device_id=${deviceId}&range=${range}`, { cache: "no-store", signal }),
          ]);
          if (!latest.ok || !history.ok) throw new Error("TELEMETRY_UNAVAILABLE");
          const snapshot = z.object({ reading: readingSchema.nullable() }).parse(await latest.json());
          const series = z.object({ readings: z.array(readingSchema), truncated: z.boolean() }).parse(await history.json());
          if (!disposed) setState(current => ({ ...current, key, reading: snapshot.reading,
            history: series.readings, truncated: series.truncated, loading: false, error: null }));
        } while (rerun && !disposed);
      } catch {
        if (!disposed) setState(current => ({ ...current, key, loading: false,
          error: "Data belum dapat dimuat. Periksa konfigurasi atau koneksi; mencoba lagi otomatis." }));
      } finally { inFlight = false; }
    }

    const client = browserSupabase();
    const channel = client?.channel(`telemetry:${deviceId}:${range}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_readings",
        filter: `device_id=eq.${deviceId}` }, () => { void refresh(); })
      .subscribe(status => {
        if (disposed) return;
        setState(current => ({ ...current, key, realtime: status === "SUBSCRIBED" }));
        // Recover persisted state on every successful connection/reconnection.
        if (status === "SUBSCRIBED") void refresh();
      });
    void refresh();
    const poll = setInterval(() => { void refresh(); }, 15000);
    const resume = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", resume);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [deviceId, range, key]);

  // Selection changes must never render the previous device's observation.
  const current = state.key === key ? state : empty(key);
  return { ...current, now, health: deviceHealth(current.reading, offlineAfterSeconds, now) };
}

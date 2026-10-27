export type DeviceHealth = "UNKNOWN" | "ONLINE" | "OFFLINE" | "STALE" | "ERROR";
type Observation = { received_at: string; measured_at: string | null; is_valid: boolean };

export function deviceHealth(reading: Observation | null, offlineAfterSeconds: number,
                             now = Date.now()): DeviceHealth {
  if (!reading) return "UNKNOWN";
  const received = Date.parse(reading.received_at);
  const measured = reading.measured_at ? Date.parse(reading.measured_at) : received;
  if (!Number.isFinite(received) || !Number.isFinite(measured)) return "ERROR";
  const timeout = offlineAfterSeconds * 1000;
  if (now - received >= timeout) return "OFFLINE";
  if (now - measured >= timeout) return "STALE";
  return reading.is_valid ? "ONLINE" : "ERROR";
}

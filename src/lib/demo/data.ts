import type { HistoryRange } from "../../hooks/use-telemetry.ts";
import type { WarningLevel } from "../iot/schema.ts";

const heights: Record<WarningLevel, number> = { NORMAL: 4, WASPADA: 12, SIAGA: 25, BAHAYA: 38 };
export type DemoSnapshot = {
  source: "DEMO"; deviceId: null; level: WarningLevel | null; heightCm: number | null;
  isRaining: boolean; health: "ONLINE" | "OFFLINE"; receivedAt: string;
};

export function demoSnapshot(level: WarningLevel, isRaining: boolean, offline: boolean,
  now = new Date()): DemoSnapshot {
  return { source: "DEMO", deviceId: null, level: offline ? null : level,
    heightCm: offline ? null : heights[level], isRaining, health: offline ? "OFFLINE" : "ONLINE",
    receivedAt: now.toISOString() };
}

export function demoSeries(level: WarningLevel, range: HistoryRange, now = new Date()) {
  const duration = { "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800 }[range] * 1000;
  return Array.from({ length: 25 }, (_, index) => ({
    source: "DEMO" as const,
    received_at: new Date(now.getTime() - duration + duration * index / 24).toISOString(),
    water_height_cm: Math.max(0, heights[level] + Math.sin(index * .7) * 2 + (index - 24) * .12),
  }));
}

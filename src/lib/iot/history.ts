const durations = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 };
export function historyStart(range: string, now = new Date()): string | null {
  return Object.hasOwn(durations, range)
    ? new Date(now.getTime() - durations[range as keyof typeof durations]).toISOString() : null;
}

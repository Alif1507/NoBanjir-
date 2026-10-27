import { z } from "zod";

export const warningLevelSchema = z.enum(["NORMAL", "WASPADA", "SIAGA", "BAHAYA"]);
export type WarningLevel = z.infer<typeof warningLevelSchema>;
export const deviceCodeSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/);
export const telemetrySchema = z.object({
  device_code: deviceCodeSchema,
  distance_cm: z.number().finite().min(0).max(10000).nullable(),
  is_raining: z.boolean().nullable(),
  float_switch_critical: z.boolean().nullable(),
  measured_at: z.iso.datetime({ offset: false }).optional(),
}).strict();
export type TelemetryPacket = z.infer<typeof telemetrySchema>;

export function parseTelemetry(value: unknown, now: Date) {
  return telemetrySchema.superRefine((packet, ctx) => {
    if (!packet.measured_at) return;
    const age = now.getTime() - Date.parse(packet.measured_at);
    if (age > 120000 || age < -30000) {
      ctx.addIssue({ code: "custom", path: ["measured_at"], message: "Timestamp outside accepted window" });
    }
  }).safeParse(value);
}

export const deviceSchema = z.object({
  id: z.uuid(), device_code: deviceCodeSchema, name: z.string(), location_description: z.string(),
  sensor_to_zero_cm: z.number(), min_distance_cm: z.number(), max_distance_cm: z.number(),
  max_water_height_cm: z.number(), waspada_min_cm: z.number(), siaga_min_cm: z.number(),
  bahaya_min_cm: z.number(), offline_after_seconds: z.number(), is_active: z.boolean(),
});
export type Device = z.infer<typeof deviceSchema>;
export const readingSchema = z.object({
  id: z.uuid(), device_id: z.uuid(), distance_cm: z.number().nullable(),
  water_height_cm: z.number().nullable(), is_raining: z.boolean().nullable(),
  float_switch_critical: z.boolean().nullable(), warning_level: warningLevelSchema.nullable(),
  is_valid: z.boolean(), validation_reason: z.string().nullable(),
  measured_at: z.string().nullable(), received_at: z.string(),
});
export type SensorReading = z.infer<typeof readingSchema>;

export const storeResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(201), reading_id: z.uuid(), water_height_cm: z.number().nullable(),
    warning_level: warningLevelSchema.nullable(), received_at: z.string(), is_valid: z.boolean() }),
  z.object({ status: z.literal(401), error: z.literal("UNAUTHORIZED") }),
  z.object({ status: z.literal(403), error: z.literal("DEVICE_DISABLED") }),
  z.object({ status: z.literal(429), error: z.literal("RATE_LIMITED"), retry_after: z.number().int().min(1).max(300) }),
  z.object({ status: z.literal(400), error: z.literal("INVALID_READING") }),
]);
export type StoreResult = z.infer<typeof storeResultSchema>;

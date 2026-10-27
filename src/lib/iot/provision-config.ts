import { z } from "zod";
import { deviceCodeSchema } from "./schema.ts";

const positive = z.number().finite().positive().max(10000);
export const provisionConfigSchema = z.object({
  device_code: deviceCodeSchema,
  name: z.string().trim().min(1).max(120),
  location_description: z.string().trim().min(1).max(500),
  sensor_to_zero_cm: positive, min_distance_cm: positive, max_distance_cm: positive,
  max_water_height_cm: positive, waspada_min_cm: z.number().finite().min(0).max(10000),
  siaga_min_cm: positive, bahaya_min_cm: positive,
  offline_after_seconds: z.number().int().min(15).max(86400).default(90),
  min_ingest_interval_seconds: z.number().int().min(1).max(300).default(1),
}).strict().refine(value => value.min_distance_cm < value.max_distance_cm &&
  value.sensor_to_zero_cm >= value.min_distance_cm && value.sensor_to_zero_cm <= value.max_distance_cm,
  "Reference height must be within the supported sensor range")
  .refine(value => value.max_water_height_cm <= value.sensor_to_zero_cm - value.min_distance_cm,
    "Maximum water level must stay outside the sensor blind zone")
  .refine(value => value.waspada_min_cm < value.siaga_min_cm && value.siaga_min_cm < value.bahaya_min_cm &&
    value.bahaya_min_cm <= value.max_water_height_cm, "Thresholds must be ordered and physically measurable");
